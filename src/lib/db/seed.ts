import { isLiveBolnaExecutionId } from "@/lib/bolna/example-desk";
import { EXAMPLE_TOKEN } from "@/lib/config";
import { query } from "@/lib/db/client";
import { latchOpsKillSwitch } from "@/lib/ops/flags";
import { istDayOffset, istStamp, istStampFromOffset, nowIstStamp } from "@/lib/time";
import { buildWeeklyNote } from "@/lib/weekly";

export { EXAMPLE_TOKEN };

/** Bump when EXAMPLE days must rebuild on hosted Kamla (stale “trying to reach” windows). */
export const EXAMPLE_SEED_REV = "2026-10-21-kamla-today";

export async function ensureSeed() {
  const example = await query<{ id: string }>("select id from parents where id = 'parent_kamla'");
  if (!example[0]) {
    const others = await query<{ n: number }>("select count(*)::int as n from parents");
    if ((others[0]?.n ?? 0) === 0) await seed();
    else await insertExampleHousehold();
  } else {
    await refreshExampleHistoryIfStale();
  }
  await query(
    `update parents
     set consent_status = 'given',
         consent_at = c.at
     from consents c
     where c.parent_id = parents.id
       and c.kind = 'parent_voice'
       and c.granted = true
       and parents.consent_status = 'pending'`,
  );
}

export async function seed() {
  await query("delete from family_messages");
  await query("delete from desk_views");
  await query("delete from alert_events");
  await query("delete from alerts");
  await query("delete from dose_logs");
  await query("delete from call_attempts");
  await query("delete from calls");
  await query("delete from schedules");
  await query("delete from medicines");
  await query("delete from consents");
  await query("delete from memory_notes");
  await query("delete from outbound_messages");
  await query("delete from push_subscriptions");
  await query("delete from webhook_events");
  await query("delete from magic_links");
  await query("delete from auth_codes");
  await query("delete from auth_tokens");
  await query("delete from family_config");
  await query("delete from family_invites");
  await query("delete from audit_events");
  await query("delete from error_events");
  await query("delete from ops_audit");
  await query("delete from ops_flags");
  latchOpsKillSwitch(false);
  await query("delete from contacts");
  await query("delete from parents");
  await insertExampleHousehold();
}

export async function insertExampleHousehold() {
  await query(`insert into parents values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [
    "parent_kamla",
    "Kamla Sharma",
    "Kamla",
    "Delhi",
    "Asia/Kolkata",
    "+910000000000",
    "hi,en",
    "08:30",
    false,
    false,
    true,
  ]);
  await query(`update parents set consent_status = $2, consent_at = $3, address_term = $4 where id = $1`, [
    "parent_kamla",
    "given",
    "2026-10-10T08:12:00+05:30",
    "Maa",
  ]);
  await query(`insert into family_config values ($1,$2,$3,$4,$5,$6,$7,$8)`, [
    "parent_kamla",
    10,
    25,
    30,
    45,
    60,
    false,
    true,
  ]);
  await query(`insert into contacts values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [
    "contact_rohit",
    "parent_kamla",
    "child",
    "Rohit Sharma",
    "Rohit",
    "+910000000001",
    "en",
    true,
    "rohit@example.invalid",
  ]);
  await query(`update contacts set is_owner = true where id = 'contact_rohit'`);
  await query(
    `update contacts set whatsapp_opt_in = true where id in ('contact_rohit', 'contact_sunita')`,
  );
  await query(`insert into contacts values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [
    "contact_sunita",
    "parent_kamla",
    "neighbour",
    "Sunita",
    "Sunita",
    "+910000000002",
    "hi",
    true,
    null,
  ]);
  await query(`insert into medicines values ($1,$2,$3,$4,$5,$6,$7)`, [
    "med_amlo",
    "parent_kamla",
    "Amlodipine",
    "5mg",
    "small white tablet",
    "after breakfast",
    true,
  ]);
  await query(`insert into medicines values ($1,$2,$3,$4,$5,$6,$7)`, [
    "med_met",
    "parent_kamla",
    "Metformin",
    "500mg",
    "larger white tablet",
    "after lunch",
    true,
  ]);
  await query(`insert into schedules values ($1,$2,$3,$4)`, ["sch_amlo", "med_amlo", "08:45", true]);
  await query(`insert into schedules values ($1,$2,$3,$4)`, ["sch_met", "med_met", "13:30", true]);
  await query(`insert into consents values ($1,$2,$3,$4,$5,$6,$7)`, [
    "con_child",
    "parent_kamla",
    "child_written",
    true,
    "2026-10-10T08:00:00+05:30",
    "Rohit typed yes on the form",
    true,
  ]);
  await query(`insert into consents values ($1,$2,$3,$4,$5,$6,$7)`, [
    "con_voice",
    "parent_kamla",
    "parent_voice",
    true,
    "2026-10-10T08:12:00+05:30",
    "haan, 2026-10-10 08:12 IST",
    true,
  ]);
  await query(`insert into consents values ($1,$2,$3,$4,$5,$6,$7)`, [
    "con_neighbour",
    "parent_kamla",
    "neighbour_whatsapp",
    true,
    "2026-10-10T08:20:00+05:30",
    "whatsapp_yes",
    true,
  ]);
  await query(`insert into magic_links values ($1,$2,$3,$4)`, [
    EXAMPLE_TOKEN,
    "parent_kamla",
    "2027-01-01T00:00:00+05:30",
    true,
  ]);

  await seedExampleHistory();
  await stampExampleRev();
}

async function exampleRev() {
  const rows = await query<{ value: string }>(`select value from ops_flags where key = 'example_seed_rev'`);
  return rows[0]?.value ?? "";
}

async function stampExampleRev() {
  const at = nowIstStamp();
  await query(
    `insert into ops_flags values ('example_seed_rev', $1, $2, 'system')
     on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    [EXAMPLE_SEED_REV, at],
  );
}

async function wipeExampleHistory() {
  await query(`delete from family_messages where parent_id = 'parent_kamla'`);
  await query(`delete from desk_views where parent_id = 'parent_kamla'`);
  await query(`delete from alert_events where alert_id in (select id from alerts where parent_id = 'parent_kamla')`);
  await query(`delete from alerts where parent_id = 'parent_kamla'`);
  await query(`delete from dose_logs where parent_id = 'parent_kamla'`);
  await query(`delete from call_attempts where call_id in (select id from calls where parent_id = 'parent_kamla')`);
  await query(`delete from memory_notes where parent_id = 'parent_kamla'`);
  await query(`delete from outbound_messages where parent_id = 'parent_kamla'`);
  await query(`delete from webhook_events where execution_id in (select id from calls where parent_id = 'parent_kamla')`);
  await query(`delete from calls where parent_id = 'parent_kamla'`);
}

async function refreshExampleHistoryIfStale() {
  if ((await exampleRev()) === EXAMPLE_SEED_REV) return;
  const rows = await query<{ id: string; bolna_execution_id: string | null }>(
    `select id, bolna_execution_id from calls where parent_id = 'parent_kamla'`,
  );
  if (rows.some((row) => isLiveBolnaExecutionId(row.bolna_execution_id || row.id))) {
    await stampExampleRev();
    return;
  }
  await wipeExampleHistory();
  await seedExampleHistory();
  await stampExampleRev();
}

async function seedExampleHistory() {
  for (let i = 0; i < 30; i += 1) {
    const day = istDayOffset(i - 29);
    const slot = i % 7;
    const isToday = i === 29;
    const callId = `call_${day}`;

    if (!isToday && (slot === 3 || slot === 6)) {
      await seedMissedDay(day, callId, slot === 6, i);
      continue;
    }

    const skipped = slot === 2 && !isToday;
    const isYesterday = i === 28;
    const variant = isToday
      ? "ok"
      : isYesterday
        ? "chest"
        : slot === 5
          ? i % 2 === 0
            ? "fall"
            : "false"
          : slot === 1
            ? "missed_med"
            : "ok";
    const alertDay = variant !== "ok";
    await seedCompletedDay(day, callId, {
      skipped,
      alertDay,
      openAlert: false,
      variant,
      hour: isToday ? 10 : isYesterday ? 17 : 8,
      minute: isToday ? 5 : isYesterday ? 8 : 30,
    });
  }

  const weekly = await buildWeeklyNote("parent_kamla");
  if (weekly) {
    await query(`insert into outbound_messages values ($1,$2,$3,$4,$5,$6,$7,$8,$9,null,null,null)`, [
      `out_week_${weekly.monday}`,
      "parent_kamla",
      "whatsapp",
      "weekly_summary",
      "+910000000001",
      weekly.bodyEn,
      `${weekly.sunday}T18:05:00+05:30`,
      "example",
      true,
    ]);
  }
}

async function seedMissedDay(day: string, callId: string, fullLadder: boolean, i: number) {
  await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
    callId,
    "parent_kamla",
    istStamp(day, 8, 30),
    istStamp(day, 8, 31),
    0,
    "missed",
    "No answer.",
    "कोई नहीं उठा।",
    null,
    null,
    null,
    null,
    null,
    true,
  ]);
  await query(`update calls set mood = $2 where id = $1`, [callId, "unclear"]);
  const results = fullLadder
    ? ["no_answer", "no_answer", "no_answer", "no_answer", "escalated"]
    : ["no_answer", "no_answer"];
  const offsets = fullLadder ? [0, 10, 25, 45, 60] : [0, 10];
  for (let idx = 0; idx < results.length; idx += 1) {
    await query(`insert into call_attempts values ($1,$2,$3,$4,$5,$6)`, [
      `att_${day}_${idx}`,
      callId,
      istStampFromOffset(day, 8, 30, offsets[idx]),
      offsets[idx],
      results[idx],
      true,
    ]);
  }
  await query(`insert into dose_logs values ($1,$2,$3,$4,$5,$6,$7,$8)`, [
    `dl_${day}_amlo`,
    "parent_kamla",
    callId,
    "med_amlo",
    day,
    "not_asked",
    null,
    true,
  ]);
  await query(`insert into dose_logs values ($1,$2,$3,$4,$5,$6,$7,$8)`, [
    `dl_${day}_met`,
    "parent_kamla",
    callId,
    "med_met",
    day,
    "not_asked",
    null,
    true,
  ]);
  if (!fullLadder) return;
  const alertId = `alert_miss_${day}`;
  const acked = true;
  const resolved = true;
  await query(`insert into alerts values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [
    alertId,
    "parent_kamla",
    callId,
    "MISSED",
    "act",
    "Couldn't reach Maa after the morning calls.",
    istStamp(day, 9, 30),
    acked ? istStamp(day, 9, 40) : null,
    acked ? "Rohit" : null,
    resolved ? istStamp(day, 10, 0) : null,
    false,
    "ladder",
    true,
  ]);
  await query(`insert into alert_events values ($1,$2,$3,$4,$5,$6,$7)`, [
    `ae_${day}_notify`,
    alertId,
    istStamp(day, 9, 30),
    "notified",
    "Saathi",
    "Rohit and Sunita ji",
    true,
  ]);
  if (acked) {
    await query(`insert into alert_events values ($1,$2,$3,$4,$5,$6,$7)`, [
      `ae_${day}_ack`,
      alertId,
      istStamp(day, 9, 40),
      "acked",
      "Rohit",
      "I'm going",
      true,
    ]);
  }
}

async function seedCompletedDay(
  day: string,
  callId: string,
  opts: {
    skipped: boolean;
    alertDay: boolean;
    openAlert: boolean;
    variant?: "ok" | "chest" | "fall" | "false" | "missed_med";
    hour?: number;
    minute?: number;
  },
) {
  const variant = opts.variant ?? (opts.alertDay ? "chest" : opts.skipped ? "ok" : "ok");
  const hour = opts.hour ?? 8;
  const minute = opts.minute ?? 30;
  const quote =
    variant === "chest"
      ? "I have chest pain. Seene mein dard ho raha hai."
      : variant === "fall"
        ? "Bathroom mein phisal gayi."
        : opts.skipped || variant === "missed_med"
          ? "Goli bhool gayi. Abhi leti hoon."
          : "Neend theek thi.";
  const summaryEn =
    variant === "fall"
      ? "Kamla said she slipped in the bathroom."
      : variant === "false"
        ? "A scare that the family later marked as a false alarm."
        : opts.skipped || variant === "missed_med"
          ? "Kamla forgot the morning tablet and said she would take it now."
          : variant === "chest"
            ? "Settings test call. Kamla said she has chest pain."
            : "Kamla slept well and took Amlodipine.";
  const summaryHi =
    variant === "fall"
      ? "बाथरूम में फिसल गईं।"
      : opts.skipped || variant === "missed_med"
        ? "गोली भूल गईं।"
        : variant === "chest"
          ? "सीने में दर्द बताया।"
          : "नींद ठीक थी, गोली ले ली।";

  const started = istStamp(day, hour, minute);
  const ended = istStampFromOffset(day, hour, minute, 4);
  await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
    callId,
    "parent_kamla",
    started,
    ended,
    variant === "chest" ? 248 : 210,
    "completed",
    summaryEn,
    summaryHi,
    quote,
    "hi",
    JSON.stringify(
      variant === "chest"
        ? [
            { speaker: "saathi", hi: "नमस्ते, मैं साथी बोल रही हूँ।", en: "Namaste, this is Saathi." },
            { speaker: "parent", hi: "हाँ, बोलो।", en: "Haan, bolo." },
            { speaker: "saathi", hi: "सीने में कोई दर्द?", en: "Any pain in the chest?" },
            { speaker: "parent", hi: "I have chest pain. सीने में दर्द हो रहा है।", en: quote },
          ]
        : [
            { speaker: "saathi", hi: "नमस्ते कमला जी।", en: "Namaste Kamla ji." },
            { speaker: "parent", hi: quote, en: quote },
          ],
    ),
    null,
    null,
    true,
  ]);
  const mood =
    variant === "chest" || variant === "fall" ? "low" : variant === "missed_med" || opts.skipped ? "okay" : "cheerful";
  await query(`update calls set mood = $2 where id = $1`, [callId, mood]);
  await query(`insert into call_attempts values ($1,$2,$3,$4,$5,$6)`, [
    `att_${day}_0`,
    callId,
    started,
    0,
    "answered",
    true,
  ]);
  await query(`insert into dose_logs values ($1,$2,$3,$4,$5,$6,$7,$8)`, [
    `dl_${day}_amlo`,
    "parent_kamla",
    callId,
    "med_amlo",
    day,
    opts.skipped ? "not_taken" : "taken",
    opts.skipped ? "bhool gayi" : "le li",
    true,
  ]);
  await query(`insert into dose_logs values ($1,$2,$3,$4,$5,$6,$7,$8)`, [
    `dl_${day}_met`,
    "parent_kamla",
    callId,
    "med_met",
    day,
    "not_asked",
    null,
    true,
  ]);
  await query(`insert into outbound_messages values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, [
    `out_${day}`,
    "parent_kamla",
    "whatsapp",
    "daily_briefing_good",
    "+910000000001",
    summaryEn,
    istStampFromOffset(day, hour, minute, 6),
    "example",
    true,
    `wamid.EXAMPLE.out_${day}`,
    "mock",
    istStampFromOffset(day, hour, minute, 6),
  ]);
  if (opts.skipped) {
    await query(`insert into memory_notes values ($1,$2,$3,$4,$5,$6)`, [
      `mem_${day}`,
      "parent_kamla",
      callId,
      "follow_up",
      "Forgot Amlodipine; said she would take it after the call.",
      true,
    ]);
  }
  if (variant === "ok") return;
  const isFalseAlarm = opts.variant === "false";
  const alertId = `alert_${day}`;
  const category = variant === "fall" ? "FALL" : variant === "missed_med" ? "MISSED_MED" : isFalseAlarm ? "FALSE" : "EMERGENCY";
  const level = variant === "missed_med" ? "look" : "act";
  const resolved = !opts.openAlert || isFalseAlarm;
  const acked = resolved || isFalseAlarm;
  await query(`insert into alerts values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [
    alertId,
    "parent_kamla",
    callId,
    category,
    level,
    isFalseAlarm || variant === "missed_med" ? "" : quote,
    istStampFromOffset(day, hour, minute, 3),
    acked ? istStampFromOffset(day, hour, minute, 10) : null,
    acked ? "Rohit" : null,
    resolved ? istStampFromOffset(day, hour, minute, 40) : null,
    false,
    isFalseAlarm ? "false_alarm" : "mid_call",
    true,
  ]);
  await query(`insert into alert_events values ($1,$2,$3,$4,$5,$6,$7)`, [
    `ae_${day}_notify`,
    alertId,
    istStampFromOffset(day, hour, minute, 3),
    "notified",
    "Saathi",
    "Rohit and Sunita ji",
    true,
  ]);
  if (opts.openAlert && variant === "chest") {
    const { sendPushToFamily } = await import("@/lib/push");
    await sendPushToFamily("parent_kamla", "Act now", quote, `alert_${alertId}`);
  }
  if (!opts.openAlert) {
    await query(`insert into alert_events values ($1,$2,$3,$4,$5,$6,$7)`, [
      `ae_${day}_ack`,
      alertId,
      istStamp(day, 8, 40),
      "acked",
      "Rohit",
      "I'm going",
      true,
    ]);
    await query(`insert into alert_events values ($1,$2,$3,$4,$5,$6,$7)`, [
      `ae_${day}_res`,
      alertId,
      istStamp(day, 9, 10),
      "resolved",
      "Rohit",
      "She's confirmed OK",
      true,
    ]);
  }
}
