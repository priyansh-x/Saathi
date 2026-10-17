import type { CallOutcome } from "@/lib/types";

export const OUTCOME_LABEL: Record<CallOutcome, string> = {
  ok: "Good",
  watch: "Needs a look",
  emergency: "Act now",
  missed: "Needs a look",
};

export function outcomeClass(outcome: CallOutcome) {
  switch (outcome) {
    case "ok":
      return "bg-good-soft text-good";
    case "watch":
    case "missed":
      return "bg-amber-soft text-amber-ink";
    case "emergency":
      return "bg-alert-soft text-alert";
  }
}
