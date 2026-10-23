import { extractSystemPrompt } from "@/lib/bolna/agent-config";
import { familyMessageContext } from "@/lib/family-messages";
import { query } from "@/lib/db/client";
import { contactsFor, medicinesWithTimes } from "@/lib/db/queries";
import { neighbourOptedIn } from "@/lib/neighbour";
import { formatHeaderDate } from "@/lib/time";
import {
  fillConsentSpokenLines,
  loadConsentSpokenVersions,
  pickConsentSpokenLines,
} from "@/lib/voice/consent-line";
import { readFileSync } from "node:fs";
import path from "node:path";

const LANGUAGE_NAMES: Record<string, string> = {
  hi: "Hindi",
  en: "English",
  mr: "Marathi",
  bn: "Bengali",
  kn: "Kannada",
  ta: "Tamil",
  te: "Telugu",
  gu: "Gujarati",
  pa: "Punjabi",
  ml: "Malayalam",
};

export type CallContext = Record<string, string>;

const MEMORY_CAP = 600;

type MemoryCall = {
  id: string;
  started_at: string;
  summary_en: string | null;
  mood_quote: string | null;
};

/** Last 3 post-consent calls as flat notes. Never includes pre-consent calls. Capped at 600 chars. */
export async function lastCallSummary(parentId: string) {
  const parent = await query<{ consent_status: string; consent_at: string | null }>(
    `select consent_status, consent_at from parents where id = $1`,
    [parentId],
  );
  const grantedAt = parent[0]?.consent_status === "given" ? parent[0].consent_at : null;
  if (!grantedAt) return "first call";

  const calls = await query<MemoryCall>(
    `select id, started_at, summary_en, mood_quote from calls
     where parent_id = $1 and status = 'completed' and started_at >= $2
     order by started_at desc limit 3`,
    [parentId, grantedAt],
  );
  if (calls.length === 0) return "first call";

  const chunks: string[] = [];
  for (const call of calls) {
    const day = call.started_at.slice(0, 10);
    const missed = await query<{ name: string }>(
      `select m.name from dose_logs d join medicines m on m.id = d.medicine_id
       where d.call_id = $1 and d.status = 'not_taken'`,
      [call.id],
    );
    const notes = await query<{ kind: string; note: string }>(
      `select kind, note from memory_notes where call_id = $1`,
      [call.id],
    );
    const sleep = notes.find((n) => /sleep|neend|नींद/i.test(`${n.kind} ${n.note}`));
    const mentioned = notes.filter((n) => n !== sleep).map((n) => n.note);
    const bits = [
      day,
      call.mood_quote ? `mood:${call.mood_quote}` : "",
      sleep ? `sleep:${sleep.note}` : "",
      mentioned.length ? `said:${mentioned.join("; ")}` : call.summary_en ? `said:${call.summary_en}` : "",
      missed.length ? `missed:${missed.map((m) => m.name).join(",")}` : "",
    ].filter(Boolean);
    chunks.push(bits.join(" "));
  }
  let text = chunks.join(" | ");
  if (text.length > MEMORY_CAP) text = text.slice(0, MEMORY_CAP);
  return text;
}

/** `{{name}}` and `{name}` tokens the Bolna prompt expects from user_data. */
export function extractPromptPlaceholders(prompt: string) {
  const names = new Set<string>();
  for (const match of prompt.matchAll(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g)) {
    names.add(match[1]!);
  }
  for (const match of prompt.matchAll(/(?<!\{)\{([a-zA-Z_][a-zA-Z0-9_]*)\}(?!\})/g)) {
    names.add(match[1]!);
  }
  return [...names].sort();
}

export function loadSystemPromptPlaceholders(root = process.cwd()) {
  const md = readFileSync(path.join(root, "docs/saathi/voice/system_prompt_bolna.md"), "utf8");
  return extractPromptPlaceholders(extractSystemPrompt(md));
}

export function assertContextCoversPrompt(prompt: string, context: CallContext) {
  const missing = extractPromptPlaceholders(prompt).filter((name) => context[name] === undefined);
  if (missing.length) {
    throw new Error(`call context missing placeholders: ${missing.join(", ")}`);
  }
}

export function preferredLanguageName(languages: string | null | undefined) {
  const first = (languages || "hi").split(",")[0]?.trim().toLowerCase() || "hi";
  return LANGUAGE_NAMES[first] || first;
}

function medicinesDueTodayText(
  rows: { id: string; name: string; dose: string; appearance: string; meal: string; time_local: string | null }[],
) {
  if (!rows.length) return "none due today";
  const lines = rows.map((m, i) => {
    const when = m.time_local ? `${m.meal}, ${m.time_local}` : m.meal;
    return `${i + 1}. id=${m.id} | ${m.name} (${m.dose}) | ${when}`;
  });
  return lines.join("\n");
}

function medicinesDueTodayFlat(
  rows: { name: string; dose: string; appearance: string; meal: string; time_local: string | null }[],
) {
  if (!rows.length) return "none due today";
  return rows
    .map((m) => [m.name, m.dose, m.appearance, m.meal, m.time_local].filter(Boolean).join(" "))
    .join("; ");
}

/** Per-call Bolna user_data. Values are flat strings. EXAMPLE households only in tests. */
export async function buildCallContext(parentId: string): Promise<CallContext> {
  const parents = await query<{
    first_name: string;
    timezone: string;
    languages: string;
    call_time: string;
    consent_status: string;
    address_term: string | null;
  }>(
    `select first_name, timezone, languages, call_time, consent_status, address_term from parents where id = $1`,
    [parentId],
  );
  const parent = parents[0];
  const contacts = await contactsFor(parentId);
  const child = contacts.find((c) => c.role === "child");
  const neighbour = contacts.find((c) => c.role === "neighbour");
  const optedIn = neighbour ? await neighbourOptedIn(parentId) : false;
  const addressTerm = parent?.address_term?.trim() || (parent?.first_name ? `${parent.first_name} ji` : "ji");
  const names = {
    parent_name: parent?.first_name ?? "",
    child_name: child?.first_name ?? "",
    neighbour_name: optedIn ? neighbour?.first_name ?? "" : "",
    address_term: addressTerm,
  };
  const spoken = fillConsentSpokenLines(
    pickConsentSpokenLines(loadConsentSpokenVersions(), optedIn),
    names,
  );
  const due = await medicinesWithTimes(parentId);
  const memory = await lastCallSummary(parentId);
  const family = await familyMessageContext(parentId);
  const context: CallContext = {
    parent_id: parentId,
    parent_name: names.parent_name,
    parent_first_name: names.parent_name,
    address_term: names.address_term,
    preferred_language: preferredLanguageName(parent?.languages),
    child_name: names.child_name,
    child_first_name: names.child_name,
    neighbour_name: names.neighbour_name,
    neighbour_present: optedIn ? "yes" : "no",
    consent_state: parent?.consent_status ?? "pending",
    consent_line_hi: spoken.hi,
    consent_line_en: spoken.en,
    child_relation: "beta",
    timezone: parent?.timezone ?? "Asia/Kolkata",
    call_date: formatHeaderDate("en"),
    call_time: parent?.call_time ?? "08:30",
    agent_gender: "female",
    last_call_summary: memory,
    call_memory: memory,
    family_message: family.family_message,
    family_from: family.family_from,
    family_message_id: family.family_message_id,
    name: family.name,
    medicines: medicinesDueTodayText(due),
    medicines_due_today: medicinesDueTodayFlat(due),
  };
  return context;
}
