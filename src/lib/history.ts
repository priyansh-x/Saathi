import type { AlertRow, CallRow, DoseLog } from "@/lib/db/types";
import { MONTH_EN, weekdayShort } from "@/lib/time";
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

export function monthLabel(day: string) {
  const { mo } = parseIstParts(`${day}T12:00:00+05:30`);
  return MONTH_EN[mo - 1];
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

export function callOnDayKey(calls: CallRow[], day: string) {
  return calls.find((c) => c.started_at.startsWith(day)) ?? null;
}

export function dayHasAlert(alerts: AlertRow[], day: string) {
  return alerts.some((a) => a.created_at.startsWith(day));
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
    const call = callOnDayKey(calls, day);
    if (call) {
      placed += 1;
      if (call.status === "completed") answered += 1;
    }
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
  const month = monthLabel(day);
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
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((line): line is { speaker: string; hi: string; en: string } => Boolean(line) && typeof line === "object");
  } catch {
    return [];
  }
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
