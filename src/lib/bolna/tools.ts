import { createHash } from "node:crypto";
import { query } from "@/lib/db/client";
import { markFamilyMessagePlayed, saveFamilyReply } from "@/lib/family-messages";
import { istDayKey, istStamp, nowIstStamp } from "@/lib/time";

function sha(text: string) {
  return createHash("sha256").update(text).digest("hex").slice(0, 24);
}

export function nowIst() {
  const day = istDayKey();
  return istStamp(day, 8, 34);
}

async function rememberTool(args: {
  callSid: string;
  parentId: string;
  tool: string;
  naturalKey: string;
  payload: unknown;
}) {
  const existing = await query<{ id: string }>(
    `select id from tool_call_logs where call_sid = $1 and tool = $2 and natural_key = $3`,
    [args.callSid, args.tool, args.naturalKey],
  );
  if (existing[0]) return { id: existing[0].id, fresh: false };
  const id = `tcl_${args.tool}_${args.naturalKey}`;
  await query(`insert into tool_call_logs values ($1,$2,$3,$4,$5,$6,$7)`, [
    id,
    args.callSid,
    args.parentId,
    args.tool,
    args.naturalKey,
    JSON.stringify(args.payload),
    nowIst(),
  ]);
  return { id, fresh: true };
}

export async function logMedicine(input: {
  call_sid: string;
  parent_id: string;
  medicine_id?: string;
  medicine_name?: string;
  status: "taken" | "not_taken" | "not_sure";
  said?: string;
}) {
  const day = istDayKey();
  let medicineId = input.medicine_id;
  if (!medicineId && input.medicine_name) {
    const rows = await query<{ id: string }>(
      `select id from medicines where parent_id = $1 and lower(name) = lower($2)`,
      [input.parent_id, input.medicine_name],
    );
    medicineId = rows[0]?.id;
  }
  if (!medicineId) return { ok: false as const, error: "unknown_medicine" };
  const key = `${input.call_sid}:${medicineId}:${day}`;
  const remembered = await rememberTool({
    callSid: input.call_sid,
    parentId: input.parent_id,
    tool: "log_medicine",
    naturalKey: key,
    payload: input,
  });
  const existing = await query<{ id: string }>(
    `select id from dose_logs where call_id = $1 and medicine_id = $2 and schedule_date = $3`,
    [input.call_sid, medicineId, day],
  );
  const doseId = existing[0]?.id ?? `dl_${input.call_sid}_${medicineId}`;
  if (existing[0]) {
    await query(`update dose_logs set status = $2, said = $3 where id = $1`, [
      doseId,
      input.status,
      input.said ?? null,
    ]);
  } else {
    try {
      await query(`insert into dose_logs values ($1,$2,$3,$4,$5,$6,$7,$8)`, [
        doseId,
        input.parent_id,
        input.call_sid,
        medicineId,
        day,
        input.status,
        input.said ?? null,
        true,
      ]);
    } catch {
      return { ok: false as const, error: "unknown_medicine" };
    }
  }
  return { ok: true as const, dose_log_id: doseId, replay: !remembered.fresh };
}

export function alertLevel(category: string) {
  if (category === "EMERGENCY" || category === "MISSED") return "act" as const;
  return "look" as const;
}

export async function raiseAlert(input: {
  call_sid: string;
  parent_id: string;
  category: "EMERGENCY" | "URGENT" | "ATTENTION" | "MISSED" | "SCAM_CONCERN" | "REFILL" | `REFILL:${string}`;
  quote: string;
  late?: boolean;
  source?: string;
}) {
  const key = `${input.call_sid}:${input.category}`;
  const remembered = await rememberTool({
    callSid: input.call_sid,
    parentId: input.parent_id,
    tool: "raise_alert",
    naturalKey: key,
    payload: input,
  });
  const existing = await query<{ id: string }>(
    `select id from alerts where call_id = $1 and category = $2`,
    [input.call_sid, input.category],
  );
  const alertId = existing[0]?.id ?? `alert_${input.call_sid}_${input.category}`;
  if (!existing[0]) {
    await query(`insert into alerts values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [
      alertId,
      input.parent_id,
      input.call_sid,
      input.category,
      alertLevel(input.category),
      input.quote,
      nowIstStamp(),
      null,
      null,
      null,
      input.late === true,
      input.source ?? (input.late ? "extraction_late" : "mid_call"),
      true,
    ]);
    await query(`insert into alert_events values ($1,$2,$3,$4,$5,$6,$7)`, [
      `ae_${alertId}_notify`,
      alertId,
      nowIstStamp(),
      "notified",
      "Saathi",
      "family",
      true,
    ]);
    try {
      const { notifyAlert } = await import("@/lib/whatsapp/notify");
      await notifyAlert(input.parent_id, {
        id: alertId,
        quote: input.quote,
        created_at: nowIstStamp(),
        category: input.category,
        level: alertLevel(input.category),
      });
    } catch {
      /* Desk alert stays even if WhatsApp or web push fails. */
    }
    if (input.category === "EMERGENCY") {
      const { optionalChildVoiceAlert } = await import("@/lib/voice-alert");
      await optionalChildVoiceAlert(input.parent_id, alertId);
    }
  }
  return { ok: true as const, alert_id: alertId, replay: !remembered.fresh };
}

export async function relayMessage(input: { call_sid: string; parent_id: string; message: string }) {
  const key = `${input.call_sid}:${sha(input.message)}`;
  await rememberTool({
    callSid: input.call_sid,
    parentId: input.parent_id,
    tool: "relay_message_to_family",
    naturalKey: key,
    payload: input,
  });
  const id = `out_relay_${key}`;
  const existing = await query<{ id: string }>(`select id from outbound_messages where id = $1`, [id]);
  if (!existing[0]) {
    const { sendFamilyMessage } = await import("@/lib/whatsapp/send");
    const contacts = await query<{ phone: string; locale: string }>(
      `select phone, locale from contacts where parent_id = $1 and role = 'child'`,
      [input.parent_id],
    );
    if (contacts[0]) {
      const parent = await query<{ first_name: string; address_term: string | null; call_time: string }>(
        `select first_name, address_term, call_time from parents where id = $1`,
        [input.parent_id],
      );
      const who = parent[0]?.address_term?.trim() || parent[0]?.first_name || "family";
      const when = parent[0]?.call_time || "";
      for (const child of contacts) {
        await sendFamilyMessage({
          parentId: input.parent_id,
          toPhone: child.phone,
          locale: child.locale === "hi" ? "hi" : "en",
          intended: "parent_relay",
          vars: [who, input.message, when],
          freeText: input.message,
          idempotencyKey: `${id}_${child.phone.replace(/\s/g, "")}`,
        });
      }
    } else {
      await query(`insert into outbound_messages values ($1,$2,$3,$4,$5,$6,$7,$8,$9,null,null,null)`, [
        id,
        input.parent_id,
        "whatsapp",
        "family_relay",
        "queued",
        input.message,
        nowIst(),
        "queued",
        true,
      ]);
    }
  }
  return { ok: true as const };
}

export async function saveMemoryNote(input: {
  call_sid: string;
  parent_id: string;
  note: string;
  kind: "follow_up" | "stop" | "other";
}) {
  const key = `${input.call_sid}:${sha(input.note)}`;
  const remembered = await rememberTool({
    callSid: input.call_sid,
    parentId: input.parent_id,
    tool: "save_memory_note",
    naturalKey: key,
    payload: input,
  });
  const noteId = `mem_${key}`;
  const existing = await query<{ id: string }>(`select id from memory_notes where id = $1`, [noteId]);
  if (!existing[0]) {
    await query(`insert into memory_notes values ($1,$2,$3,$4,$5,$6)`, [
      noteId,
      input.parent_id,
      input.call_sid,
      input.kind,
      input.note,
      true,
    ]);
  }
  return { ok: true as const, note_id: noteId, replay: !remembered.fresh };
}

export async function requestRefill(input: { call_sid: string; parent_id: string; medicine_name: string }) {
  const medicine = input.medicine_name.replace(/\s+/g, " ").trim();
  if (!medicine) return { ok: false as const, error: "empty" };
  const parent = await query<{ first_name: string; address_term: string | null; is_example: boolean }>(
    `select first_name, address_term, is_example from parents where id = $1`,
    [input.parent_id],
  );
  const who = parent[0]?.address_term?.trim() || parent[0]?.first_name || "Maa";
  const quote = `${who} says ${medicine} is running low.`;
  const category = `REFILL:${medicine}` as const;
  const key = `${input.call_sid}:${medicine.toLowerCase()}`;
  const remembered = await rememberTool({
    callSid: input.call_sid,
    parentId: input.parent_id,
    tool: "request_refill",
    naturalKey: key,
    payload: input,
  });
  const raised = await raiseAlert({
    call_sid: input.call_sid,
    parent_id: input.parent_id,
    category,
    quote,
    source: "request_refill",
  });
  const { createRefillHandoff } = await import("@/lib/partners/errands");
  const handoff = await createRefillHandoff({
    parentId: input.parent_id,
    callId: input.call_sid,
    medicineName: medicine,
    isExample: parent[0]?.is_example === true,
  });
  return {
    ok: true as const,
    alert_id: raised.alert_id,
    quote,
    replay: !remembered.fresh || raised.replay,
    errand_id: handoff.ok ? handoff.errand.id : null,
    handoff_blocked: !handoff.ok,
  };
}

export async function saveFamilyReplyTool(input: {
  call_sid: string;
  parent_id: string;
  family_message_id: string;
  reply: string;
}) {
  const remembered = await rememberTool({
    callSid: input.call_sid,
    parentId: input.parent_id,
    tool: "save_family_reply",
    naturalKey: `${input.call_sid}:${input.family_message_id}`,
    payload: input,
  });
  const saved = await saveFamilyReply({
    family_message_id: input.family_message_id,
    reply: input.reply,
    call_id: input.call_sid,
  });
  return { ...saved, replay: !remembered.fresh || ("replay" in saved && saved.replay) };
}

export async function familyMessagePlayedTool(input: {
  call_sid: string;
  parent_id: string;
  family_message_id: string;
}) {
  const remembered = await rememberTool({
    callSid: input.call_sid,
    parentId: input.parent_id,
    tool: "family_message_played",
    naturalKey: `${input.call_sid}:${input.family_message_id}`,
    payload: input,
  });
  const marked = await markFamilyMessagePlayed({
    family_message_id: input.family_message_id,
    call_id: input.call_sid,
  });
  return { ...marked, replay: !remembered.fresh || ("replay" in marked && marked.replay) };
}

export async function hasRaiseAlert(callSid: string, category: string) {
  const rows = await query<{ n: number }>(
    `select count(*)::int as n from tool_call_logs
     where call_sid = $1 and tool = 'raise_alert' and natural_key = $2`,
    [callSid, `${callSid}:${category}`],
  );
  return (rows[0]?.n ?? 0) > 0;
}

export async function deleteRaiseAlertLog(callSid: string, category: string) {
  await query(`delete from tool_call_logs where call_sid = $1 and tool = 'raise_alert' and natural_key = $2`, [
    callSid,
    `${callSid}:${category}`,
  ]);
}
