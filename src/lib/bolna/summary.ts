import { contactsFor, medicinesFor } from "@/lib/db/queries";
import { query } from "@/lib/db/client";
import { istDayKey } from "@/lib/time";

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
  const parents = await query<{ first_name: string; timezone: string }>(
    `select first_name, timezone from parents where id = $1`,
    [parentId],
  );
  const parent = parents[0];
  const contacts = await contactsFor(parentId);
  const child = contacts.find((c) => c.role === "child");
  return {
    parent_id: parentId,
    parent_first_name: parent?.first_name ?? "",
    child_first_name: child?.first_name ?? "",
    timezone: parent?.timezone ?? "Asia/Kolkata",
    last_call_summary: await lastCallSummary(parentId),
    medicines_due_today: (await medicinesFor(parentId))
      .map((m) => `${m.name} ${m.appearance} ${m.meal}`)
      .join("; "),
  };
}
