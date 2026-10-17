/** Contracts from prd.md §8 and §11.3. Persist these; do not invent parallel shapes. */

export type Relation = "Amma" | "Aai" | "Nani" | "Papa" | "Appa";

export type Language = "Hindi" | "Marathi" | "Tamil" | "Kannada";

export type CallFlag =
  | "meds_taken"
  | "meds_skipped"
  | "pain"
  | "lonely"
  | "well"
  | "fall";

export type CallOutcome = "ok" | "watch" | "emergency" | "missed";

export type Household = {
  childName: string;
  childWhatsapp: string;
  parentName: string;
  relation: Relation;
  parentPhone: string;
  city: string;
  language: Language;
  callTime: string;
  medicines: string;
  neighborName: string;
  neighborPhone: string;
  parentConsented: boolean;
  paused: boolean;
};

export type TranscriptLine = {
  speaker: "agent" | "parent";
  hi: string;
  en: string;
};

export type CallRecord = {
  endedAt: string;
  durationSec: number;
  flags: CallFlag[];
  outcome: CallOutcome;
  summaryHi: string;
  summaryEn: string;
  transcript: TranscriptLine[];
};

export const STORAGE_HOUSEHOLD = "checkin-household";
export const STORAGE_LAST_CALL = "checkin-last-call";
export const STORAGE_CALL_LOG = "checkin-call-log";
