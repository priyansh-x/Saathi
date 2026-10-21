export type TranscriptTurn = { speaker: "saathi" | "parent"; text: string };

function turnFromUnknown(entry: unknown): TranscriptTurn | null {
  if (typeof entry === "string") {
    const match = entry.match(/^\s*(assistant|user|agent|parent|saathi)\s*:\s*(.*)$/i);
    if (match) {
      const role = match[1].toLowerCase();
      const text = match[2].trim();
      if (!text) return null;
      return { speaker: role === "user" || role === "parent" ? "parent" : "saathi", text };
    }
    const text = entry.trim();
    return text ? { speaker: "parent", text } : null;
  }
  if (!entry || typeof entry !== "object") return null;
  const row = entry as Record<string, unknown>;
  const speakerRaw = String(row.speaker ?? row.role ?? row.actor ?? "");
  const text = String(row.content ?? row.text ?? row.message ?? row.hi ?? "").trim();
  if (!text) return null;
  const parent = /user|parent|human/i.test(speakerRaw);
  return { speaker: parent ? "parent" : "saathi", text };
}

export function coerceBolnaTranscript(raw?: unknown): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === "[]" || trimmed === "null" || trimmed === "undefined") return undefined;
    return raw;
  }
  if (Array.isArray(raw)) {
    const lines = raw
      .map((entry) => {
        const turn = turnFromUnknown(entry);
        if (!turn) return "";
        return `${turn.speaker === "parent" ? "user" : "assistant"}: ${turn.text}`;
      })
      .filter(Boolean);
    return lines.length ? lines.join("\n") : undefined;
  }
  if (typeof raw === "object") {
    const row = raw as Record<string, unknown>;
    if (typeof row.transcript === "string") return row.transcript;
    if (Array.isArray(row.messages) || Array.isArray(row.turns)) {
      return coerceBolnaTranscript(row.messages ?? row.turns);
    }
  }
  return undefined;
}

/** Bolna transcripts are newline `assistant:` / `user:` lines. `agent:` is treated as Saathi. */
export function parseBolnaTranscript(raw?: unknown): TranscriptTurn[] {
  const text = coerceBolnaTranscript(raw);
  if (!text) return [];
  const turns: TranscriptTurn[] = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(assistant|user|agent|parent|saathi)\s*:\s*(.*)$/i);
    if (!match) continue;
    const role = match[1].toLowerCase();
    const spoken = match[2].trim();
    if (!spoken) continue;
    turns.push({ speaker: role === "user" || role === "parent" ? "parent" : "saathi", text: spoken });
  }
  if (turns.length === 0) {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map(turnFromUnknown).filter((row): row is TranscriptTurn => Boolean(row));
      }
    } catch {
      /* plain text */
    }
  }
  return turns;
}

export function transcriptHasParent(raw?: unknown) {
  return parseBolnaTranscript(raw).some((turn) => turn.speaker === "parent");
}

export function transcriptJson(raw?: unknown) {
  const turns = parseBolnaTranscript(raw);
  const text = coerceBolnaTranscript(raw);
  if (turns.length === 0) {
    if (!text) return null;
    const trimmed = text.trim();
    if (trimmed === "[]" || trimmed === "null") return null;
    return JSON.stringify([{ speaker: "parent", hi: text, en: text }]);
  }
  return JSON.stringify(turns.map((turn) => ({ speaker: turn.speaker, hi: turn.text, en: turn.text })));
}

/** True when a stored transcript_json actually has spoken turns, not `[]` / null. */
export function transcriptJsonHasWords(raw?: string | null) {
  const value = (raw || "").trim();
  if (!value || value === "[]" || value === "null" || value === "undefined") return false;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return parsed.length > 0;
  } catch {
    /* plain text */
  }
  return parseBolnaTranscript(value).length > 0 || value.length > 2;
}
