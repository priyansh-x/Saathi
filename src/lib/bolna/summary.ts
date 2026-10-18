import { contactsFor, medicinesFor } from "@/lib/db/queries";
import { query } from "@/lib/db/client";
import { formatHeaderDate } from "@/lib/time";
import { fillConsentSpokenLines, loadConsentSpokenLines } from "@/lib/voice/consent-line";

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

export async function promptVariables(parentId: string) {
  const parents = await query<{ first_name: string; timezone: string; languages: string; call_time: string }>(
    `select first_name, timezone, languages, call_time from parents where id = $1`,
    [parentId],
  );
  const parent = parents[0];
  const contacts = await contactsFor(parentId);
  const child = contacts.find((c) => c.role === "child");
  const neighbour = contacts.find((c) => c.role === "neighbour");
  const names = {
    parent_name: parent?.first_name ?? "",
    child_name: child?.first_name ?? "",
    neighbour_name: neighbour?.first_name ?? "",
    address_term: parent?.first_name ? `${parent.first_name} ji` : "ji",
  };
  const spoken = fillConsentSpokenLines(loadConsentSpokenLines(), names);
  const meds = await medicinesFor(parentId);
  const medicines = meds
    .map((m, i) => `${i + 1}. id=${m.id} | ${m.name} (${m.dose}) | ${m.meal}, ${m.appearance}`)
    .join("\n");
  const memory = await lastCallSummary(parentId);
  return {
    parent_id: parentId,
    parent_name: names.parent_name,
    parent_first_name: names.parent_name,
    address_term: names.address_term,
    preferred_language: parent?.languages?.includes("hi") ? "Hindi" : "English",
    child_name: names.child_name,
    child_first_name: names.child_name,
    neighbour_name: names.neighbour_name,
    consent_line_hi: spoken.hi,
    consent_line_en: spoken.en,
    child_relation: "beta",
    timezone: parent?.timezone ?? "Asia/Kolkata",
    call_date: formatHeaderDate("en"),
    call_time: parent?.call_time ?? "08:30",
    agent_gender: "female",
    last_call_summary: memory,
    call_memory: memory,
    medicines,
    medicines_due_today: meds.map((m) => `${m.name} ${m.appearance} ${m.meal}`).join("; "),
  };
}
