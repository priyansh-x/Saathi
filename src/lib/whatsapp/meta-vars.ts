import { clockFromMinutes, parseHhMm } from "@/lib/time";

export const META_UTILITY_TEMPLATES = [
  "daily_briefing_good",
  "daily_briefing_missed_med",
  "daily_briefing_low_mood",
  "safety_alert_emergency",
  "safety_alert_unreachable",
] as const;

export type MetaUtilityTemplate = (typeof META_UTILITY_TEMPLATES)[number];

/** "hi" when the family's first language is Hindi, otherwise "en". */
export function familyTemplateLanguage(languages?: string | null): "en" | "hi" {
  const first = (languages || "").split(",")[0]?.trim().toLowerCase() || "";
  if (first === "hi" || first === "hin" || first === "hindi") return "hi";
  return "en";
}

export function nonEmptyParam(raw: string | null | undefined, fallback: string) {
  const cleaned = String(raw ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || fallback;
}

export function quoteParam(raw: string | null | undefined, fallback = "no quote") {
  return nonEmptyParam(raw, fallback).slice(0, 200);
}

/** English "8:05 AM". Hindi body takes "8:05". Empty becomes "today". */
export function templateCallTime(raw: string | null | undefined, language: "en" | "hi") {
  const source = String(raw ?? "").trim();
  if (!source) return "today";
  const hhmm = source.includes("T") ? source.slice(11, 16) : source;
  if (!/^\d{1,2}:\d{2}/.test(hhmm)) return "today";
  const { hour, minute } = clockFromMinutes(parseHhMm(hhmm));
  const h12 = hour % 12 || 12;
  const mm = String(minute).padStart(2, "0");
  if (language === "hi") return `${h12}:${mm}`;
  return `${h12}:${mm} ${hour < 12 ? "AM" : "PM"}`;
}

export function metaBodyComponents(vars: string[]) {
  return [
    {
      type: "body" as const,
      parameters: vars.map((text) => ({ type: "text" as const, text })),
    },
  ];
}

export function dailyBriefingGoodVars(
  input: {
    childName?: string | null;
    parentName?: string | null;
    callTime?: string | null;
    medicines?: string | null;
    quote?: string | null;
  },
  language: "en" | "hi",
) {
  return [
    nonEmptyParam(input.childName, "family"),
    nonEmptyParam(input.parentName, "your parent"),
    templateCallTime(input.callTime, language),
    nonEmptyParam(input.medicines, "today's medicines"),
    quoteParam(input.quote),
  ];
}

export function dailyBriefingMissedMedVars(
  input: {
    childName?: string | null;
    parentName?: string | null;
    callTime?: string | null;
    missedDoses?: string | null;
  },
  language: "en" | "hi",
) {
  return [
    nonEmptyParam(input.childName, "family"),
    nonEmptyParam(input.parentName, "your parent"),
    templateCallTime(input.callTime, language),
    nonEmptyParam(input.missedDoses, "a tablet"),
  ];
}

export function dailyBriefingLowMoodVars(
  input: {
    childName?: string | null;
    parentName?: string | null;
    callTime?: string | null;
    quote?: string | null;
  },
  language: "en" | "hi",
) {
  return [
    nonEmptyParam(input.childName, "family"),
    nonEmptyParam(input.parentName, "your parent"),
    templateCallTime(input.callTime, language),
    quoteParam(input.quote),
  ];
}

export function safetyAlertEmergencyVars(
  input: {
    childName?: string | null;
    parentName?: string | null;
    quote?: string | null;
    callTime?: string | null;
    deskUrl?: string | null;
  },
  language: "en" | "hi",
) {
  return [
    nonEmptyParam(input.childName, "family"),
    nonEmptyParam(input.parentName, "your parent"),
    quoteParam(input.quote),
    templateCallTime(input.callTime, language),
    nonEmptyParam(input.deskUrl, "https://saathi.example/d/example-kamla"),
  ];
}

export function safetyAlertUnreachableVars(input: {
  childName?: string | null;
  parentName?: string | null;
  tryCount?: string | number | null;
  deskUrl?: string | null;
}) {
  const tries = String(input.tryCount ?? "").trim();
  return [
    nonEmptyParam(input.childName, "family"),
    nonEmptyParam(input.parentName, "your parent"),
    nonEmptyParam(tries, "1"),
    nonEmptyParam(input.deskUrl, "https://saathi.example/d/example-kamla"),
  ];
}
