import { childrenFor } from "@/lib/members";
import { query } from "@/lib/db/client";
import type { AlertRow, CallRow, DoseLog, Parent } from "@/lib/db/types";
import {
  WEEKDAY_EN,
  WEEKDAY_HI,
  formatWeekRange,
  inSundayEveningWindow,
  istDayOffset,
  istWeekDays,
  istWeekMonday,
  parseIstParts,
} from "@/lib/time";
import { sendPushToFamily } from "@/lib/push";
import { sendFamilyMessage } from "@/lib/whatsapp/send";
import { renderTemplate } from "@/lib/whatsapp/templates";

export type WeeklyNote = {
  monday: string;
  sunday: string;
  range: string;
  answered: number;
  dosesTaken: number;
  dosesExpected: number;
  moodEn: string;
  moodHi: string;
  notableEn: string;
  notableHi: string;
  quote: string | null;
  varsEn: string[];
  varsHi: string[];
  bodyEn: string;
  bodyHi: string;
};

function who(parent: Pick<Parent, "address_term" | "first_name">) {
  const term = parent.address_term?.trim();
  return term || parent.first_name;
}

function moodLine(calls: Pick<CallRow, "started_at" | "status" | "mood">[], hi: boolean) {
  const done = calls.filter((c) => c.status === "completed");
  if (done.length === 0) return hi ? "साफ़ नहीं" : "not clear";
  const counts = { cheerful: 0, okay: 0, low: 0, unclear: 0 };
  const lowDays: string[] = [];
  for (const call of done) {
    const mood = call.mood === "cheerful" || call.mood === "okay" || call.mood === "low" ? call.mood : "unclear";
    counts[mood] += 1;
    if (mood === "low") {
      const { weekday } = parseIstParts(call.started_at);
      lowDays.push(hi ? WEEKDAY_HI[weekday] : WEEKDAY_EN[weekday]);
    }
  }
  const ranked: Array<"cheerful" | "okay" | "low"> = ["cheerful", "okay", "low"];
  ranked.sort((a, b) => counts[b] - counts[a]);
  const top = counts[ranked[0]] > 0 ? ranked[0] : "unclear";
  const mostly =
    hi ?
      top === "cheerful" ? "ज़्यादातर खुश"
      : top === "okay" ? "ज़्यादातर ठीक"
      : top === "low" ? "ज़्यादातर उदास"
      : "साफ़ नहीं"
    : top === "cheerful" ? "mostly cheerful"
    : top === "okay" ? "mostly okay"
    : top === "low" ? "mostly low"
    : "not clear";
  if (lowDays.length && top !== "low") {
    return hi ? `${mostly}, ${lowDays[0]} को उदास` : `${mostly}, low on ${lowDays[0]}`;
  }
  return mostly;
}

function notableLine(args: { alerts: Pick<AlertRow, "category">[]; quote: string | null; hi: boolean }) {
  const real = args.alerts.filter((a) => a.category !== "FALSE");
  const bits: string[] = [];
  if (real.length === 1) bits.push(args.hi ? "इस हफ़्ते एक अलर्ट" : "one alert this week");
  else if (real.length > 1) bits.push(args.hi ? `इस हफ़्ते ${real.length} अलर्ट` : `${real.length} alerts this week`);
  if (args.quote) bits.push(args.quote);
  if (bits.length === 0) return args.hi ? "कुछ ख़ास नहीं" : "nothing unusual";
  return bits.join("; ");
}

export async function buildWeeklyNote(parentId: string, now = new Date()): Promise<WeeklyNote | null> {
  const parents = await query<Parent>(`select * from parents where id = $1`, [parentId]);
  const parent = parents[0];
  if (!parent) return null;
  const days = istWeekDays(now);
  const monday = days[0];
  const sunday = days[6];
  const start = `${monday}T00:00:00+05:30`;
  const weekEnd = `${istDayOffset(1, new Date(`${sunday}T12:00:00+05:30`))}T00:00:00+05:30`;

  const calls = await query<CallRow>(
    `select * from calls
     where parent_id = $1 and started_at >= $2 and started_at < $3
     order by started_at`,
    [parentId, start, weekEnd],
  );
  const doses = await query<DoseLog>(
    `select * from dose_logs
     where parent_id = $1 and schedule_date >= $2 and schedule_date <= $3`,
    [parentId, monday, sunday],
  );
  const alerts = await query<AlertRow>(
    `select * from alerts
     where parent_id = $1 and created_at >= $2 and created_at < $3
     order by created_at`,
    [parentId, start, weekEnd],
  );
  const meds = await query<{ n: number }>(`select count(*)::int as n from medicines where parent_id = $1`, [parentId]);
  const answered = calls.filter((c) => c.status === "completed").length;
  const dosesTaken = doses.filter((d) => d.status === "taken").length;
  const dosesExpected = (meds[0]?.n ?? 0) * 7;
  const allowQuote = parent.consent_status === "given" && Boolean(parent.consent_at);
  const lastQuote = allowQuote
    ? (calls.filter((c) => c.status === "completed" && c.mood_quote?.trim()).at(-1)?.mood_quote?.trim() ?? null)
    : null;
  const name = who(parent);
  const range = formatWeekRange(monday, sunday);
  const moodEn = moodLine(calls, false);
  const moodHi = moodLine(calls, true);
  const notableEn = notableLine({ alerts, quote: lastQuote, hi: false });
  const notableHi = notableLine({ alerts, quote: lastQuote, hi: true });
  const varsEn = [name, range, String(answered), String(dosesTaken), String(dosesExpected), moodEn, notableEn];
  const varsHi = [name, range, String(answered), String(dosesTaken), String(dosesExpected), moodHi, notableHi];
  return {
    monday,
    sunday,
    range,
    answered,
    dosesTaken,
    dosesExpected,
    moodEn,
    moodHi,
    notableEn,
    notableHi,
    quote: lastQuote,
    varsEn,
    varsHi,
    bodyEn: renderTemplate("weekly_summary_en", varsEn),
    bodyHi: renderTemplate("weekly_summary_hi", varsHi),
  };
}

export async function sendWeeklyNote(parentId: string, now = new Date()) {
  const parent = await query<Pick<Parent, "id" | "paused" | "consent_status">>(
    `select id, paused, consent_status from parents where id = $1`,
    [parentId],
  );
  if (!parent[0] || parent[0].paused) return { ok: false as const, skipped: "paused" as const };
  if (parent[0].consent_status === "declined") return { ok: false as const, skipped: "declined" as const };
  const note = await buildWeeklyNote(parentId, now);
  if (!note) return { ok: false as const, skipped: "missing" as const };
  const children = await childrenFor(parentId);
  if (children.length === 0) return { ok: false as const, skipped: "missing_child" as const };
  const monday = istWeekMonday(now);
  const results = [];
  for (const child of children) {
    const hi = child.locale === "hi";
    results.push(
      await sendFamilyMessage({
        parentId,
        toPhone: child.phone,
        locale: hi ? "hi" : "en",
        intended: hi ? "weekly_summary_hi" : "weekly_summary_en",
        vars: hi ? note.varsHi : note.varsEn,
        idempotencyKey: `week_${monday}_${child.phone.replace(/\s/g, "")}`,
      }),
    );
  }
  await sendPushToFamily(parentId, "This week's note", note.bodyEn, `week_${monday}`);
  return { ok: true as const, note, results };
}

export async function sendSundayWeeklyNotes(now = new Date()) {
  if (!inSundayEveningWindow(now)) return { ok: true as const, skipped: "not_sunday_evening" as const, results: [] };
  const parents = await query<{ id: string }>(`select id from parents`);
  const results = [];
  for (const parent of parents) {
    results.push({ parent_id: parent.id, ...(await sendWeeklyNote(parent.id, now)) });
  }
  return { ok: true as const, results };
}

export async function latestWeeklyNote(parentId: string, now = new Date()) {
  const rows = await query<{ body: string; template: string; at: string; status: string }>(
    `select body, template, at, status from outbound_messages
     where parent_id = $1 and template like 'weekly_summary%'
     order by at desc limit 1`,
    [parentId],
  );
  return {
    monday: istWeekMonday(now),
    built: await buildWeeklyNote(parentId, now),
    sent: rows[0] ?? null,
  };
}
