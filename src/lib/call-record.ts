import { summarise } from "@/lib/script";
import type { CallFlag, CallRecord, Household, TranscriptLine } from "@/lib/types";

let seq = 0;

export function makeCallRecord(input: {
  household: Household;
  outcome: CallRecord["outcome"];
  flags: CallFlag[];
  lines: TranscriptLine[];
  startedAt: number;
  endedAt: number;
}): CallRecord {
  const summary = summarise(input.household, input.flags, input.outcome);
  seq += 1;
  const minute = String(20 + (seq % 40)).padStart(2, "0");
  return {
    endedAt: `2026-10-17T08:${minute}:00.000Z`,
    durationSec: Math.max(8, Math.round((input.endedAt - input.startedAt) / 1000)),
    flags: input.flags,
    outcome: input.outcome,
    summaryHi: summary.hi,
    summaryEn: summary.en,
    transcript: input.lines,
  };
}
