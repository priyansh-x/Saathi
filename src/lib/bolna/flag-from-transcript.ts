import { parseBolnaTranscript } from "@/lib/bolna/transcript";

const PAIN = "dard|दर्द|pain";

const POSITIVE = [
  /seene.{0,20}(dard|दर्द|pain)/i,
  /chest.{0,16}pain/i,
  /सीने.{0,20}(dard|दर्द|pain)/,
  new RegExp(`(dard|दर्द|pain).{0,20}(seene|सीने|sine|cene)`, "i"),
  /phisal/i,
  /फिसल/,
  /\bfell\b|\bfall\b/i,
  /gir gayi|gir gaye|gir gaya/i,
  /ambulance/i,
  /\b112\b/,
  /can't breathe|cannot breathe|cant breathe/i,
  /saans (nahi|nahin|nahīn)/i,
];

const DENIED = /(nahi|nahin|nahīn|नहीं|no|not).{0,24}(dard|pain|seene|chest|सीने|sine)|(dard|pain|seene|chest|सीने|sine).{0,24}(nahi|nahin|nahīn|नहीं|no)/i;

/** Speech-to-text often writes सीने as "sir senior" / "sine". */
export function foldChestSpeech(text: string) {
  return text
    .replace(/sir\s*senior/gi, "seene")
    .replace(/\bsenior\b/gi, "seene")
    .replace(/\bseenay\b/gi, "seene")
    .replace(/\bsine\b/gi, "seene")
    .replace(/\bcene\b/gi, "seene")
    .replace(/सीने/g, "seene");
}

export function flagFromTranscript(raw?: unknown) {
  if (raw == null || raw === "") return null;
  for (const turn of parseBolnaTranscript(raw)) {
    if (turn.speaker !== "parent") continue;
    const text = turn.text.trim();
    if (!text) continue;
    const folded = foldChestSpeech(text);
    if (DENIED.test(text) || DENIED.test(folded)) continue;
    if (!POSITIVE.some((rule) => rule.test(text) || rule.test(folded))) continue;
    if (!new RegExp(PAIN, "i").test(folded) && !/chest|ambulance|112|fell|fall|phisal|फिसल|breathe|saans/i.test(folded)) {
      continue;
    }
    return {
      category: "EMERGENCY" as const,
      quote: text.slice(0, 180),
      confidence: "transcript",
    };
  }
  return null;
}
