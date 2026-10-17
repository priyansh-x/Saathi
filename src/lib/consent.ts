import { query } from "@/lib/db/client";
import type { Parent } from "@/lib/db/types";
import { nowIstStamp } from "@/lib/time";
import { sendFamilyMessage } from "@/lib/whatsapp/send";

export type SpokenAnswer = "yes" | "no";
export type ConsentStatus = "pending" | "given" | "declined";

export async function consentsFor(parentId: string) {
  return query<{ kind: string; granted: boolean; at: string; evidence: string | null }>(
    `select kind, granted, at, evidence from consents where parent_id = $1`,
    [parentId],
  );
}

export async function parentConsent(parentId: string) {
  const rows = await query<Pick<Parent, "consent_status" | "consent_at" | "paused">>(
    `select consent_status, consent_at, paused from parents where id = $1`,
    [parentId],
  );
  const status = (rows[0]?.consent_status ?? "pending") as ConsentStatus;
  return { status, at: rows[0]?.consent_at ?? null, paused: rows[0]?.paused ?? false };
}

export async function hasPilotConsent(parentId: string) {
  const rows = await consentsFor(parentId);
  const child = rows.some((r) => r.kind === "child_written" && r.granted);
  const { status } = await parentConsent(parentId);
  if (!child || status === "declined") return false;
  return status === "given" || status === "pending";
}

export async function recordConsent(parentId: string, kind: "child_written" | "parent_voice", evidence: string) {
  const id = `con_${kind}_${parentId}`;
  await query(`delete from consents where parent_id = $1 and kind = $2`, [parentId, kind]);
  await query(`insert into consents values ($1,$2,$3,$4,$5,$6,$7)`, [
    id,
    parentId,
    kind,
    true,
    nowIstStamp(),
    evidence,
    true,
  ]);
}

export async function recordSpokenConsent(input: {
  call_sid: string;
  parent_id: string;
  answer: SpokenAnswer;
}) {
  const answer = input.answer === "yes" ? "yes" : "no";
  const at = nowIstStamp();
  const status: ConsentStatus = answer === "yes" ? "given" : "declined";
  await query(`update parents set consent_status = $2, consent_at = $3, recording_consent = $4 where id = $1`, [
    input.parent_id,
    status,
    at,
    answer === "yes",
  ]);
  if (answer === "yes") {
    await recordConsent(input.parent_id, "parent_voice", `spoken ${answer} on ${input.call_sid}`);
    return { ok: true as const, status, paused: false };
  }
  await query(`delete from consents where parent_id = $1 and kind = $2`, [input.parent_id, "parent_voice"]);
  await query(`update parents set paused = true where id = $1`, [input.parent_id]);
  await notifyConsentDeclined(input.parent_id);
  return { ok: true as const, status, paused: true };
}

async function notifyConsentDeclined(parentId: string) {
  const child = await query<{ phone: string; locale: string; first_name: string }>(
    `select phone, locale, first_name from contacts where parent_id = $1 and role = 'child' limit 1`,
    [parentId],
  );
  const parent = await query<{ first_name: string }>(`select first_name from parents where id = $1`, [parentId]);
  if (!child[0] || !parent[0]) return;
  const locale = child[0].locale === "hi" ? "hi" : "en";
  await sendFamilyMessage({
    parentId,
    toPhone: child[0].phone,
    locale,
    intended: locale === "hi" ? "consent_declined_hi" : "consent_declined_en",
    vars: [parent[0].first_name],
    idempotencyKey: `consent_declined_${parentId}`,
  });
}
