import { parseBolnaTranscript } from "@/lib/bolna/transcript";

const POSITIVE = [
  /seene.{0,16}dard/i,
  /chest.{0,16}pain/i,
  /सीने.{0,16}दर्द/,
  /phisal/i,
  /फिसल/,
  /\bfell\b|\bfall\b/i,
  /gir gayi|gir gaye|gir gaya/i,
  /ambulance/i,
  /\b112\b/,
  /can't breathe|cannot breathe|cant breathe/i,
  /saans (nahi|nahin|nahīn)/i,
];

const DENIED = /(nahi|nahin|nahīn|नहीं|no|not).{0,24}(dard|pain|seene|chest|सीने)|(dard|pain|seene|chest|सीने).{0,24}(nahi|nahin|nahīn|नहीं|no)/i;

export function flagFromTranscript(raw?: string | null) {
  if (!raw) return null;
  for (const turn of parseBolnaTranscript(raw)) {
    if (turn.speaker !== "parent") continue;
    const text = turn.text.trim();
    if (!text) continue;
    if (DENIED.test(text)) continue;
    if (!POSITIVE.some((rule) => rule.test(text))) continue;
    return {
      category: "EMERGENCY" as const,
      quote: text.slice(0, 180),
      confidence: "transcript",
    };
  }
  return null;
}
