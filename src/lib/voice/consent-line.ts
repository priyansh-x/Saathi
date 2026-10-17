import { readFileSync } from "node:fs";
import path from "node:path";

export const CONSENT_LINE_PATH = "docs/saathi/voice/consent_line.md";
export const CONSENT_HI_TOKEN = "{{FIRST_CALL_CONSENT_HI}}";
export const CONSENT_EN_TOKEN = "{{FIRST_CALL_CONSENT_EN}}";

export type ConsentSpokenLines = { hi: string; en: string };

function unwrapSpoken(raw: string) {
  return raw
    .trim()
    .replace(/^[«"“]+/, "")
    .replace(/[»"”]+$/, "")
    .trim();
}

function spokenAfter(md: string, heading: string) {
  const idx = md.indexOf(heading);
  if (idx < 0) return "";
  const rest = md.slice(idx + heading.length);
  const line = rest
    .split("\n")
    .map((row) => row.trim())
    .find(Boolean);
  return line ? unwrapSpoken(line) : "";
}

/** Product owns the wording in consent_line.md. Do not copy it elsewhere. */
export function parseConsentLineMarkdown(md: string): ConsentSpokenLines {
  const hi = spokenAfter(md, "**Hindi (spoken):**");
  const en = spokenAfter(md, "**English (spoken):**");
  if (!hi || !en) throw new Error("consent_line.md is missing Hindi or English spoken lines");
  return { hi, en };
}

export function loadConsentSpokenLines(root = process.cwd()): ConsentSpokenLines {
  const md = readFileSync(path.join(root, CONSENT_LINE_PATH), "utf8");
  return parseConsentLineMarkdown(md);
}

export function injectConsentLines(prompt: string, lines: ConsentSpokenLines): string {
  if (!prompt.includes(CONSENT_HI_TOKEN) || !prompt.includes(CONSENT_EN_TOKEN)) {
    throw new Error("agent prompt is missing FIRST_CALL_CONSENT placeholders");
  }
  return prompt.replaceAll(CONSENT_HI_TOKEN, lines.hi).replaceAll(CONSENT_EN_TOKEN, lines.en);
}
