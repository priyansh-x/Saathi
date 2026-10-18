import { EXAMPLE_TOKEN } from "@/lib/config";
import { query } from "@/lib/db/client";
import { istDayOffset, istStamp, istStampFromOffset } from "@/lib/time";

export { EXAMPLE_TOKEN };

export async function ensureSeed() {
  const existing = await query<{ n: number }>("select count(*)::int as n from parents");
  if ((existing[0]?.n ?? 0) > 0) {
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
    return;
  }
  await seed();
}

export async function seed() {
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
  await query("delete from webhook_events");
  await query("delete from magic_links");
  await query("delete from family_config");
  await query("delete from audit_events");
  await query("delete from contacts");
  await query("delete from parents");

  await query(`insert into parents values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [
    "parent_kamla",
    "Kamla Sharma",
    "Kamla",
    "Delhi",
    "Asia/Kolkata",
    "98100 22118",
    "hi,en",
    "08:30",
    false,
    false,
    true,
  ]);
  await query(`update parents set consent_status = $2, consent_at = $3 where id = $1`, [
    "parent_kamla",
    "given",
    "2026-10-10T08:12:00+05:30",
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
    "98765 44110",
    "en",
    true,
    "rohit@example.invalid",
  ]);
  await query(`insert into contacts values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [
    "contact_sunita",
    "parent_kamla",
    "neighbour",
    "Sunita",
    "Sunita",
    "98111 77821",
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
  await query(`insert into magic_links values ($1,$2,$3,$4)`, [
    EXAMPLE_TOKEN,
    "parent_kamla",
    "2027-01-01T00:00:00+05:30",
    true,
  ]);

  for (let i = 0; i < 30; i += 1) {
    const day = istDayOffset(i - 29);
    const slot = i % 7;
    const isToday = i === 29;
    const callId = `call_${day}`;

    if (slot === 3 || slot === 6) {
      await seedMissedDay(day, callId, slot === 6, i);
      continue;
    }

    const skipped = slot === 2 && !isToday;
    const variant = isToday ? "chest" : slot === 5 ? (i % 2 === 0 ? "fall" : "false") : slot === 1 ? "missed_med" : "ok";
    const alertDay = variant !== "ok";
    await seedCompletedDay(day, callId, {
      skipped,
      alertDay: alertDay || isToday,
      openAlert: isToday,
      variant: isToday ? "chest" : variant,
    });
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
  const acked = i < 28;
  const resolved = i < 26;
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
  },
) {
  const variant = opts.variant ?? (opts.alertDay ? "chest" : opts.skipped ? "ok" : "ok");
  const quote =
    variant === "chest"
      ? "Seene mein dard ho raha hai."
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
            ? "Kamla said she has pain in her chest."
            : "Kamla slept well and took Amlodipine.";
  const summaryHi =
    variant === "fall"
      ? "बाथरूम में फिसल गईं।"
      : opts.skipped || variant === "missed_med"
        ? "गोली भूल गईं।"
        : variant === "chest"
          ? "सीने में दर्द बताया।"
          : "नींद ठीक थी, गोली ले ली।";

  await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
    callId,
    "parent_kamla",
    istStamp(day, 8, 30),
    istStamp(day, 8, 34),
    210,
    "completed",
    summaryEn,
    summaryHi,
    quote,
    "hi",
    JSON.stringify([
      { speaker: "agent", hi: "नमस्ते कमला जी।", en: "Namaste Kamla ji." },
      { speaker: "parent", hi: quote, en: quote },
    ]),
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
    istStamp(day, 8, 30),
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
  await query(`insert into outbound_messages values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [
    `out_${day}`,
    "parent_kamla",
    "whatsapp",
    "daily_briefing_en",
    "98765 44110",
    summaryEn,
    istStamp(day, 8, 36),
    "example",
    true,
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
    istStamp(day, 8, 33),
    acked ? istStamp(day, 8, 40) : null,
    acked ? "Rohit" : null,
    resolved ? istStamp(day, 9, 10) : null,
    false,
    isFalseAlarm ? "false_alarm" : "mid_call",
    true,
  ]);
  await query(`insert into alert_events values ($1,$2,$3,$4,$5,$6,$7)`, [
    `ae_${day}_notify`,
    alertId,
    istStamp(day, 8, 33),
    "notified",
    "Saathi",
    "Rohit and Sunita ji",
    true,
  ]);
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
