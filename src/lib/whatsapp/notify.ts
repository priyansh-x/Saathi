import { contactsFor, dosesOnDay, openActAlerts } from "@/lib/db/queries";
import { childrenFor } from "@/lib/members";
import { neighbourOptedIn } from "@/lib/neighbour";
import { query } from "@/lib/db/client";
import type { AlertRow, CallRow, Contact, Parent } from "@/lib/db/types";
import { EXAMPLE_TOKEN, publicBaseUrl } from "@/lib/config";
import { todayStatus } from "@/lib/db/queries";
import { formatIstTime, istDayKey, istStamp, nowIstStamp, parseHhMm } from "@/lib/time";
import { sendPushToFamily } from "@/lib/push";
import { sendFamilyMessage } from "@/lib/whatsapp/send";
import { ladderConfig, nextRetryLabel } from "@/lib/ladder";
import {
  dailyBriefingGoodVars,
  dailyBriefingLowMoodVars,
  dailyBriefingMissedMedVars,
  familyTemplateLanguage,
  safetyAlertEmergencyVars,
  safetyAlertUnreachableVars,
} from "@/lib/whatsapp/meta-vars";
import { type TemplateName } from "@/lib/whatsapp/templates";

async function magicUrl(parentId: string) {
  const rows = await query<{ token: string }>(
    `select token from magic_links where parent_id = $1 limit 1`,
    [parentId],
  );
  const token = rows[0]?.token || EXAMPLE_TOKEN;
  return `${publicBaseUrl()}/d/${token}`;
}

async function household(parentId: string) {
  const parents = await query<Parent>(`select * from parents where id = $1`, [parentId]);
  const contacts = await contactsFor(parentId);
  return {
    parent: parents[0],
    children: contacts.filter((c) => c.role === "child"),
    child: contacts.find((c) => c.role === "child") ?? null,
    neighbour: contacts.find((c) => c.role === "neighbour") ?? null,
  };
}

function localeOf(contact: Contact | null): "en" | "hi" {
  return contact?.locale === "hi" ? "hi" : "en";
}

function medLine(doses: { name?: string; status: string }[]) {
  if (doses.length === 0) return "";
  return doses
    .map((d) => {
      const mark =
        d.status === "taken" ? "taken" : d.status === "not_taken" ? "not taken" : "not asked";
      return `${d.name ?? "tablet"} ${mark}`;
    })
    .join("; ");
}

function missedDoseLine(doses: { name?: string; status: string }[]) {
  return doses
    .filter((d) => d.status === "not_taken")
    .map((d) => d.name?.trim())
    .filter(Boolean)
    .join(", ");
}

export async function sendDailyBriefing(
  parentId: string,
  call: Pick<CallRow, "id" | "mood_quote" | "status"> & { mood?: CallRow["mood"] },
) {
  const { parent, children } = await household(parentId);
  if (!parent || children.length === 0) return { ok: false as const, reason: "missing_child" };
  const day = istDayKey();
  const callMin = parseHhMm(parent.call_time || "08:30");
  const doses = await dosesOnDay(parentId, day);
  const act = await openActAlerts(parentId);
  const status = todayStatus({
    paused: parent.paused,
    call: {
      ...call,
      parent_id: parentId,
      started_at: istStamp(day, Math.floor(callMin / 60), callMin % 60),
      ended_at: null,
      duration_sec: null,
      summary_en: null,
      summary_hi: null,
      mood_quote_lang: null,
      transcript_json: null,
    } as CallRow,
    doses,
    actAlerts: act,
    nowMin: 12 * 60,
    callTimeMin: callMin,
  });
  const url = await magicUrl(parentId);
  const token = url.split("/d/")[1] || EXAMPLE_TOKEN;
  const missed = doses.find((d) => d.status === "not_taken");
  const intended =
    call.status === "missed" || call.status === "no_conversation" || call.status === "failed" || status === "trying"
      ? "missed_call_soft"
      : missed
        ? "daily_briefing_missed_med"
        : call.mood === "low"
          ? "daily_briefing_low_mood"
          : "daily_briefing_good";
  const who = parent.address_term?.trim() || parent.first_name;
  const parentName = parent.first_name;
  const familyLang = familyTemplateLanguage(parent.languages);
  const tries = await query<{ n: number }>(`select count(*)::int as n from call_attempts where call_id = $1`, [call.id]);
  const cfg = await ladderConfig(parentId);
  const results = [];
  for (const child of children) {
    const locale = intended === "missed_call_soft" ? localeOf(child) : familyLang;
    const vars =
      intended === "missed_call_soft"
        ? [
            who,
            String(tries[0]?.n || 1),
            parent.call_time,
            nextRetryLabel(parent.call_time, 0, cfg),
            parent.phone,
          ]
        : intended === "daily_briefing_missed_med"
          ? dailyBriefingMissedMedVars(
              {
                childName: child.first_name,
                parentName,
                callTime: parent.call_time,
                missedDoses: missedDoseLine(doses),
              },
              familyLang,
            )
          : intended === "daily_briefing_low_mood"
            ? dailyBriefingLowMoodVars(
                {
                  childName: child.first_name,
                  parentName,
                  callTime: parent.call_time,
                  quote: call.mood_quote,
                },
                familyLang,
              )
            : dailyBriefingGoodVars(
                {
                  childName: child.first_name,
                  parentName,
                  callTime: parent.call_time,
                  medicines: medLine(doses),
                  quote: call.mood_quote,
                },
                familyLang,
              );
    results.push(
      await sendFamilyMessage({
        parentId,
        toPhone: child.phone,
        locale,
        intended,
        vars,
        buttonUrlVar: token,
        idempotencyKey: `briefing:${call.id}`,
      }),
    );
  }
  return { ok: true as const, results };
}

export async function notifyAlert(
  parentId: string,
  alert: Pick<AlertRow, "id" | "quote" | "created_at"> & { category?: string; level?: string },
) {
  const { parent, neighbour } = await household(parentId);
  if (!parent) return { ok: false as const };
  const who = parent.address_term?.trim() || parent.first_name;
  const parentName = parent.first_name;
  const familyLang = familyTemplateLanguage(parent.languages);
  const childTemplate =
    alert.category === "MISSED" || alert.level === "look"
      ? "safety_alert_unreachable"
      : alert.category === "EMERGENCY" || alert.level === "act"
        ? "safety_alert_emergency"
        : "safety_alert_urgent";
  const neighbourTemplate =
    childTemplate === "safety_alert_unreachable" ? "responder_alert_unreachable" : "responder_alert_emergency";
  const results = [];
  const kids = await childrenFor(parentId);
  const tries = await query<{ n: number }>(
    `select count(*)::int as n from call_attempts where call_id in (select call_id from alerts where id = $1)`,
    [alert.id],
  );
  const tryCount = String(Math.max(1, tries[0]?.n || 1));
  const desk = await magicUrl(parentId);
  const level = alert.level || "look";
  let neighbourMessaged = false;
  if (neighbour && (await neighbourOptedIn(parentId))) {
    const childName = kids[0]?.first_name ?? "family";
    const nvars =
      neighbourTemplate === "responder_alert_unreachable"
        ? [neighbour.first_name, who, parent.city, childName]
        : [neighbour.first_name, who, parent.city, alert.quote, childName];
    const sent = await sendFamilyMessage({
      parentId,
      toPhone: neighbour.phone,
      locale: localeOf(neighbour),
      intended: neighbourTemplate,
      vars: nvars,
      idempotencyKey: `resp_${alert.id}_${neighbour.phone.replace(/\s/g, "")}`,
    });
    neighbourMessaged = sent.ok && !String(sent.status).startsWith("blocked") && !String(sent.status).startsWith("failed");
    results.push(sent);
  }
  for (const child of kids) {
    const submitted =
      childTemplate === "safety_alert_emergency" || childTemplate === "safety_alert_unreachable";
    const locale = submitted ? familyLang : localeOf(child);
    const intended = (
      submitted || neighbourMessaged ? childTemplate : `${childTemplate}_solo`
    ) as Exclude<TemplateName, "hello_world">;
    const vars =
      intended === "safety_alert_unreachable" || intended === "safety_alert_unreachable_solo"
        ? safetyAlertUnreachableVars({
            childName: child.first_name,
            parentName,
            tryCount,
            deskUrl: desk,
          })
        : intended === "safety_alert_emergency" || intended === "safety_alert_emergency_solo"
          ? safetyAlertEmergencyVars(
              {
                childName: child.first_name,
                parentName,
                quote: alert.quote,
                callTime: parent.call_time || alert.created_at,
                deskUrl: desk,
              },
              familyLang,
            )
          : [child.first_name, who, alert.quote, parent.call_time || "today", desk];
    results.push(
      await sendFamilyMessage({
        parentId,
        toPhone: child.phone,
        locale,
        intended,
        vars,
        idempotencyKey: `alert:${alert.id}:${level}`,
      }),
    );
  }
  await sendPushToFamily(parentId, "Act now", alert.quote || "Open the family desk.", `alert_${alert.id}`);
  return { ok: true as const, results };
}

export async function broadcastAck(parentId: string, alertId: string, actor: string) {
  const { neighbour } = await household(parentId);
  const when = formatIstTime(nowIstStamp().slice(11, 16));
  const opted = neighbour && (await neighbourOptedIn(parentId)) ? neighbour : null;
  const targets = [...(await childrenFor(parentId)), opted].filter(Boolean) as Contact[];
  const results = [];
  for (const person of targets) {
    results.push(
      await sendFamilyMessage({
        parentId,
        toPhone: person.phone,
        locale: localeOf(person),
        intended: "alert_ack_update",
        vars: [actor, when, (await household(parentId)).parent?.first_name ?? "Maa"],
        idempotencyKey: `ack_${alertId}_${person.phone.replace(/\s/g, "")}`,
      }),
    );
  }
  return results;
}
