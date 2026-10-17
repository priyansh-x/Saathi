export type TranscriptTurn = { speaker: "saathi" | "parent"; text: string };

/** Bolna transcripts are newline `assistant:` / `user:` lines. `agent:` is treated as Saathi. */
export function parseBolnaTranscript(raw?: string): TranscriptTurn[] {
  if (!raw) return [];
  const turns: TranscriptTurn[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*(assistant|user|agent)\s*:\s*(.*)$/i);
    if (!match) continue;
    const role = match[1].toLowerCase();
    const text = match[2].trim();
    if (!text) continue;
    turns.push({ speaker: role === "user" ? "parent" : "saathi", text });
  }
  return turns;
}

export function transcriptHasParent(raw?: string) {
  return parseBolnaTranscript(raw).some((turn) => turn.speaker === "parent");
}

export function transcriptJson(raw?: string) {
  const turns = parseBolnaTranscript(raw);
  if (turns.length === 0) return raw ? JSON.stringify([{ speaker: "parent", hi: raw, en: raw }]) : null;
  return JSON.stringify(turns.map((turn) => ({ speaker: turn.speaker, hi: turn.text, en: turn.text })));
}
