import { parseBolnaTranscript } from "@/lib/bolna/transcript";
import type { AlertRow, CallRow, DoseLog } from "@/lib/db/types";
import { MONTH_EN, MONTH_HI, weekdayShort } from "@/lib/time";
import type { Lang } from "@/lib/i18n/messages";
import { messages } from "@/lib/i18n/messages";
import { parseIstParts } from "@/lib/time";

export type Mood = "cheerful" | "okay" | "low" | "unclear";

export function qs(params: Record<string, string | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") search.set(key, value);
  }
  const out = search.toString();
  return out ? `?${out}` : "";
}

export function mondayIndex(day: string) {
  const { weekday } = parseIstParts(`${day}T12:00:00+05:30`);
  return (weekday + 6) % 7;
}

export function monthLabel(day: string, lang: Lang = "en") {
  const { mo } = parseIstParts(`${day}T12:00:00+05:30`);
  return (lang === "hi" ? MONTH_HI : MONTH_EN)[mo - 1];
}

export function moodFromCall(call?: CallRow | null): Mood {
  if (!call || call.status !== "completed") return "unclear";
  const stored = call.mood;
  if (stored === "cheerful" || stored === "okay" || stored === "low" || stored === "unclear") return stored;
  return "unclear";
}

export function medsOnDay(doses: DoseLog[], day: string, medicineIds: string[]) {
  const taken = medicineIds.filter((id) =>
    doses.some((d) => d.schedule_date === day && d.medicine_id === id && d.status === "taken"),
  ).length;
  return { taken, total: medicineIds.length };
}

export function callsOnDay(calls: CallRow[], day: string) {
  return calls
    .filter((c) => c.started_at.startsWith(day))
    .sort((a, b) => b.started_at.localeCompare(a.started_at));
}

export function callOnDayKey(calls: CallRow[], day: string) {
  return callsOnDay(calls, day)[0] ?? null;
}

export function dayHasAlert(alerts: AlertRow[], day: string) {
  return alerts.some((a) => a.created_at.startsWith(day));
}

export function callHasAlert(alerts: AlertRow[], callId: string) {
  return alerts.some((a) => a.call_id === callId);
}

export function historyRowShowsAlert(alerts: AlertRow[], dayCalls: CallRow[], call: CallRow, index: number) {
  if (callHasAlert(alerts, call.id)) return true;
  if (dayCalls.some((row) => callHasAlert(alerts, row.id))) return false;
  return index === 0 && alerts.some((row) => row.created_at.startsWith(call.started_at.slice(0, 10)));
}

export function historySummary(
  days: string[],
  calls: CallRow[],
  doses: DoseLog[],
  medicineIds: string[],
  lang: Lang,
) {
  const t = messages[lang];
  let answered = 0;
  let placed = 0;
  let taken = 0;
  let expected = 0;
  for (const day of days) {
    const dayCalls = callsOnDay(calls, day);
    placed += dayCalls.length;
    answered += dayCalls.filter((call) => call.status === "completed").length;
    const meds = medsOnDay(doses, day, medicineIds);
    taken += meds.taken;
    expected += meds.total;
  }
  return lang === "hi"
    ? `${answered} में से ${placed} कॉल उठीं · ${taken} में से ${expected} दवा`
    : `${t.answeredCount} ${answered} of ${placed} ${t.callsWord} · ${taken} of ${expected} ${t.medicinesWord}`;
}

export function cellAria(
  day: string,
  call: CallRow | null,
  meds: { taken: number; total: number },
  lang: Lang,
) {
  const { d } = parseIstParts(`${day}T12:00:00+05:30`);
  const weekday = weekdayShort(day, lang);
  const month = monthLabel(day, lang);
  const callWord =
    !call || call.status === "no_conversation"
      ? messages[lang].cellNoCall
      : call.status === "missed"
        ? messages[lang].cellMissed
        : messages[lang].cellAnswered;
  return `${weekday} ${d} ${month}: ${callWord}, ${meds.taken} ${messages[lang].ofWord} ${meds.total} ${messages[lang].medicinesWord}`;
}

export function callGlyph(call: CallRow | null) {
  if (!call) return "–";
  if (call.status === "missed" || call.status === "failed") return "✕";
  if (call.status === "completed") return "✓";
  return "–";
}

export function dayCallLabel(call: CallRow | null, lang: Lang) {
  const t = messages[lang];
  if (!call) return t.notYet;
  if (call.status === "missed" || call.status === "in_progress" || call.status === "failed") return t.missed;
  if (call.status === "completed") return t.answered;
  return t.headlineSkipped;
}

export function dayMedsLabel(meds: { taken: number; total: number }, lang: Lang) {
  const t = messages[lang];
  if (meds.total <= 0) return t.noMedicinesListed;
  if (meds.taken >= meds.total) return t.allMedicinesTaken;
  return `${meds.taken} ${t.ofWord} ${meds.total} ${t.medicinesWord}`;
}

export function moodLabel(mood: Mood, lang: Lang) {
  const t = messages[lang];
  if (mood === "cheerful") return t.moodCheerful;
  if (mood === "okay") return t.moodOkay;
  if (mood === "low") return t.moodLow;
  return t.moodUnclear;
}

export function callTranscriptLines(raw: unknown): { speaker: string; hi: string; en: string }[] {
  if (!raw) return [];
  const fromStored = (parsed: unknown): { speaker: string; hi: string; en: string }[] => {
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((line) => {
        if (!line || typeof line !== "object") return null;
        const row = line as Record<string, unknown>;
        const text = String(row.hi || row.en || row.text || row.content || row.message || "").trim();
        const speaker = String(row.speaker || row.role || "parent");
        if (!text && !row.hi && !row.en) return null;
        return {
          speaker,
          hi: String(row.hi || text),
          en: String(row.en || text),
        };
      })
      .filter((row): row is { speaker: string; hi: string; en: string } => Boolean(row));
  };
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const stored = fromStored(parsed);
    if (stored.length) return stored;
  } catch {
    /* Bolna newline transcript */
  }
  return parseBolnaTranscript(raw).map((line) => ({
    speaker: line.speaker,
    hi: line.text,
    en: line.text,
  }));
}

export function callBullets(summary: string | null | undefined) {
  if (!summary) return [];
  return summary
    .split(/(?<=[.।!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export function callLanguageLabel(lang: Lang, spoken?: string | null) {
  const hi = spoken === "hi" || spoken?.startsWith("hi");
  return hi ? (lang === "hi" ? "हिंदी" : "Hindi") : lang === "hi" ? "अंग्रेज़ी" : "English";
}

/* ---------- Month calendar ---------- */

export type DayStatus = "answered" | "missed" | "skipped" | "none";

/** "2026-11" from "2026-11-05". */
export function monthKeyOf(day: string) {
  return day.slice(0, 7);
}

export function shiftMonth(monthKey: string, delta: number) {
  const [y, m] = monthKey.split("-").map(Number);
  const index = y * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

export function daysInMonth(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Monday-first weeks; null pads the leading and trailing cells. */
export function monthGrid(monthKey: string): (string | null)[] {
  const first = `${monthKey}-01`;
  const lead = mondayIndex(first);
  const total = daysInMonth(monthKey);
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= total; d++) cells.push(`${monthKey}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

const MONTH_LONG_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_LONG_HI = [
  "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
  "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर",
];

export function monthTitle(monthKey: string, lang: Lang) {
  const [y, m] = monthKey.split("-").map(Number);
  return `${(lang === "hi" ? MONTH_LONG_HI : MONTH_LONG_EN)[m - 1]} ${y}`;
}

/** Column heads, Monday first. */
export function weekdayInitials(lang: Lang) {
  return lang === "hi" ? ["सो", "मं", "बु", "गु", "शु", "श", "र"] : ["M", "T", "W", "T", "F", "S", "S"];
}

/** One answered call makes the day answered; otherwise a missed call makes it missed. */
export function dayStatus(dayCalls: CallRow[]): DayStatus {
  if (dayCalls.some((c) => c.status === "completed")) return "answered";
  if (dayCalls.some((c) => c.status === "missed" || c.status === "failed" || c.status === "in_progress")) return "missed";
  if (dayCalls.length) return "skipped";
  return "none";
}

export function dayAlerts(alerts: AlertRow[], calls: CallRow[], day: string) {
  const ids = new Set(callsOnDay(calls, day).map((c) => c.id));
  return alerts.filter((a) => a.created_at.startsWith(day) || (a.call_id != null && ids.has(a.call_id)));
}

/** Totals for the days of a month that have happened, from the first loaded day on. */
export function monthStats(
  monthKey: string,
  today: string,
  firstDay: string,
  calls: CallRow[],
  doses: DoseLog[],
  alerts: AlertRow[],
  medicineIds: string[],
) {
  let answered = 0;
  let placed = 0;
  let taken = 0;
  let expected = 0;
  let alertDays = 0;
  for (const day of monthGrid(monthKey)) {
    if (!day || day > today || day < firstDay) continue;
    const dayCalls = callsOnDay(calls, day);
    placed += dayCalls.length;
    answered += dayCalls.filter((c) => c.status === "completed").length;
    const meds = medsOnDay(doses, day, medicineIds);
    taken += meds.taken;
    expected += meds.total;
    if (dayAlerts(alerts, calls, day).length) alertDays += 1;
  }
  return { answered, placed, taken, expected, alertDays };
}
