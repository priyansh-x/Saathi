import { contactsFor, medicinesFor } from "@/lib/db/queries";
import { query } from "@/lib/db/client";
import { formatHeaderDate, istDayKey } from "@/lib/time";
import { fillConsentSpokenLines, loadConsentSpokenLines } from "@/lib/voice/consent-line";

export async function lastCallSummary(parentId: string) {
  const day = istDayKey();
  const meds = await medicinesFor(parentId);
  const notes = await query<{ note: string; kind: string }>(
    `select note, kind from memory_notes where parent_id = $1 order by id desc limit 4`,
    [parentId],
  );
  const last = await query<{ summary_en: string | null; mood_quote: string | null }>(
    `select summary_en, mood_quote from calls
     where parent_id = $1 and status = 'completed'
     order by started_at desc limit 1`,
    [parentId],
  );
  const due = meds.map((m) => `${m.name} ${m.dose} ${m.meal} (${m.appearance})`).join("; ");
  const parts = [
    last[0]?.summary_en ? `Last: ${last[0].summary_en}` : "",
    last[0]?.mood_quote ? `Quote: ${last[0].mood_quote}` : "",
    notes.length ? `Notes: ${notes.map((n) => `${n.kind}: ${n.note}`).join("; ")}` : "",
    due ? `Due today (${day}): ${due}` : "",
  ].filter(Boolean);
  return parts.join(" ").slice(0, 800);
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
    last_call_summary: await lastCallSummary(parentId),
    medicines,
    medicines_due_today: meds.map((m) => `${m.name} ${m.appearance} ${m.meal}`).join("; "),
  };
}
