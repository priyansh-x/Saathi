import { readFileSync } from "node:fs";
import path from "node:path";

export const CONSENT_LINE_PATH = "docs/saathi/voice/consent_line.md";
export const CONSENT_HI_TOKEN = "{{consent_line_hi}}";
export const CONSENT_EN_TOKEN = "{{consent_line_en}}";

export type ConsentSpokenLines = { hi: string; en: string };

export type ConsentNameVars = {
  parent_name: string;
  child_name: string;
  neighbour_name: string;
  address_term?: string;
};

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

const NEIGHBOUR_TOKEN = /\{\{neighbour_name\}\}|\{neighbour_name\}/;

function tidySpoken(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([।.!?])/g, "$1")
    .replace(/,\s*,/g, ",")
    .replace(/^\s*,\s*/, "")
    .trim();
}

/** Drop any sentence that names the neighbour so an empty name never stays in the line. */
export function dropNeighbourClauses(text: string) {
  const sentences = text.split(/(?<=[।.!?])\s+/);
  return tidySpoken(sentences.filter((sentence) => !NEIGHBOUR_TOKEN.test(sentence)).join(" "));
}

export function fillConsentSpokenLine(template: string, names: ConsentNameVars) {
  let text = names.neighbour_name.trim() ? template : dropNeighbourClauses(template);
  const address = names.address_term ?? (names.parent_name ? `${names.parent_name} ji` : "ji");
  const map: Record<string, string> = {
    parent_name: names.parent_name,
    child_name: names.child_name,
    neighbour_name: names.neighbour_name,
    address_term: address,
  };
  for (const [key, value] of Object.entries(map)) {
    text = text.replaceAll(`{{${key}}}`, value).replaceAll(`{${key}}`, value);
  }
  return tidySpoken(text);
}

export function fillConsentSpokenLines(lines: ConsentSpokenLines, names: ConsentNameVars) {
  return {
    hi: fillConsentSpokenLine(lines.hi, names),
    en: fillConsentSpokenLine(lines.en, names),
  };
}

export function injectConsentLines(prompt: string): string {
  if (!prompt.includes(CONSENT_HI_TOKEN) || !prompt.includes(CONSENT_EN_TOKEN)) {
    throw new Error("agent prompt is missing consent_line placeholders");
  }
  return prompt;
}
