import type { CallOutcome } from "@/lib/types";

export const OUTCOME_LABEL: Record<CallOutcome, string> = {
  ok: "OK",
  watch: "WATCH",
  emergency: "EMERGENCY",
  missed: "MISSED",
};

export function outcomeClass(outcome: CallOutcome) {
  switch (outcome) {
    case "ok":
      return "bg-[oklch(0.93_0.04_145)] text-[oklch(0.32_0.06_145)]";
    case "watch":
      return "bg-[oklch(0.93_0.05_85)] text-[oklch(0.38_0.08_55)]";
    case "emergency":
      return "bg-destructive/10 text-destructive";
    case "missed":
      return "bg-muted text-foreground";
  }
}
