import { contactsFor, dosesOnDay, openActAlerts } from "@/lib/db/queries";
import { query } from "@/lib/db/client";
import type { AlertRow, CallRow, Contact, Parent } from "@/lib/db/types";
import { EXAMPLE_TOKEN, publicBaseUrl } from "@/lib/config";
import { todayStatus } from "@/lib/db/queries";
import { formatIstTime, istDayKey } from "@/lib/time";
import { sendFamilyMessage } from "@/lib/whatsapp/send";

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
    child: contacts.find((c) => c.role === "child") ?? null,
    neighbour: contacts.find((c) => c.role === "neighbour") ?? null,
  };
}

function localeOf(contact: Contact | null): "en" | "hi" {
  return contact?.locale === "hi" ? "hi" : "en";
}

function medLine(doses: { name?: string; status: string }[]) {
  if (doses.length === 0) return "—";
  return doses
    .map((d) => {
      const mark =
        d.status === "taken" ? "taken" : d.status === "not_taken" ? "not taken" : "not asked";
      return `${d.name ?? "tablet"} ${mark}`;
    })
    .join("; ");
}

export async function sendDailyBriefing(parentId: string, call: Pick<CallRow, "id" | "mood_quote" | "status">) {
  const { parent, child } = await household(parentId);
  if (!parent || !child) return { ok: false as const, reason: "missing_child" };
  const day = istDayKey();
  const doses = await dosesOnDay(parentId, day);
  const act = await openActAlerts(parentId);
  const status = todayStatus({
    paused: parent.paused,
    call: {
      ...call,
      parent_id: parentId,
      started_at: `${day}T08:30:00+05:30`,
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
    callTimeMin: 8 * 60 + 30,
  });
  const label = status === "act" ? "Act now" : status === "look" || status === "trying" ? "Needs a look" : "Good";
  const url = await magicUrl(parentId);
  return sendFamilyMessage({
    parentId,
    toPhone: child.phone,
    locale: localeOf(child),
    intended: localeOf(child) === "hi" ? "daily_briefing_hi" : "daily_briefing_en",
    vars: [
      parent.first_name,
      parent.call_time,
      label,
      medLine(doses),
      call.mood_quote || "—",
      url,
    ],
    idempotencyKey: `brief_${call.id}_${child.phone.replace(/\s/g, "")}`,
  });
}

export async function notifyAlert(parentId: string, alert: Pick<AlertRow, "id" | "quote" | "created_at">) {
  const { parent, child, neighbour } = await household(parentId);
  if (!parent) return { ok: false as const };
  const url = `${await magicUrl(parentId)}/alerts/${alert.id}`;
  const time = alert.created_at.includes("T") ? alert.created_at.slice(11, 16) : "08:33";
  const results = [];
  if (child) {
    results.push(
      await sendFamilyMessage({
        parentId,
        toPhone: child.phone,
        locale: localeOf(child),
        intended: localeOf(child) === "hi" ? "safety_alert_hi" : "safety_alert_en",
        vars: [
          parent.first_name,
          alert.quote,
          time,
          child.first_name,
          neighbour?.first_name ?? "neighbour",
          url,
        ],
        idempotencyKey: `alert_${alert.id}_${child.phone.replace(/\s/g, "")}`,
      }),
    );
  }
  if (neighbour) {
    results.push(
      await sendFamilyMessage({
        parentId,
        toPhone: neighbour.phone,
        locale: localeOf(neighbour),
        intended: localeOf(neighbour) === "hi" ? "responder_hi" : "responder_en",
        vars: [parent.first_name, alert.quote, time],
        idempotencyKey: `resp_${alert.id}_${neighbour.phone.replace(/\s/g, "")}`,
      }),
    );
  }
  return { ok: true as const, results };
}

export async function broadcastAck(parentId: string, alertId: string, actor: string) {
  const { child, neighbour } = await household(parentId);
  const when = formatIstTime("08:40");
  const targets = [child, neighbour].filter(Boolean) as Contact[];
  const results = [];
  for (const person of targets) {
    results.push(
      await sendFamilyMessage({
        parentId,
        toPhone: person.phone,
        locale: localeOf(person),
        intended: localeOf(person) === "hi" ? "alert_ack_update_hi" : "alert_ack_update_en",
        vars: [actor, when],
        idempotencyKey: `ack_${alertId}_${person.phone.replace(/\s/g, "")}`,
      }),
    );
  }
  return results;
}
