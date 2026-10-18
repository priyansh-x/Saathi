import { DEMO_HOUSEHOLD } from "@/lib/demo-household";
import { buildBeats, closingLine } from "@/lib/script";

export function demoMorningLines() {
  const beats = buildBeats(DEMO_HOUSEHOLD);
  const pick = ["slept", "took", "fine", "visitor"];
  const lines: { speaker: "agent" | "parent"; hi: string; en: string }[] = [];
  for (const beat of beats) {
    lines.push({ speaker: "agent", hi: beat.hi, en: beat.en });
    const choice = beat.choices.find((c) => pick.includes(c.id)) ?? beat.choices[0];
    if (choice) {
      lines.push({ speaker: "parent", hi: choice.hi, en: choice.en });
    }
  }
  const close = closingLine(DEMO_HOUSEHOLD, ["well", "meds_taken"]);
  lines.push({ speaker: "agent", hi: close.hi, en: close.en });
  return lines;
}
