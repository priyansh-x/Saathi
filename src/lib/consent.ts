import { query } from "@/lib/db/client";
import type { Parent } from "@/lib/db/types";
import { nowIstStamp } from "@/lib/time";
import { sendFamilyMessage } from "@/lib/whatsapp/send";

export type SpokenAnswer = "yes" | "no" | "later";
export type ConsentStatus = "pending" | "given" | "declined";

export async function consentsFor(parentId: string) {
  return query<{ kind: string; granted: boolean; at: string; evidence: string | null }>(
    `select kind, granted, at, evidence from consents where parent_id = $1`,
    [parentId],
  );
}

export async function parentConsent(parentId: string) {
  const rows = await query<Pick<Parent, "consent_status" | "consent_at" | "paused" | "consent_later_count">>(
    `select consent_status, consent_at, paused, consent_later_count from parents where id = $1`,
    [parentId],
  );
  const status = (rows[0]?.consent_status ?? "pending") as ConsentStatus;
  return {
    status,
    at: rows[0]?.consent_at ?? null,
    paused: rows[0]?.paused ?? false,
    laterCount: rows[0]?.consent_later_count ?? 0,
  };
}

export async function hasPilotConsent(parentId: string) {
  const rows = await consentsFor(parentId);
  const child = rows.some((r) => r.kind === "child_written" && r.granted);
  const { status, laterCount } = await parentConsent(parentId);
  if (!child || status === "declined") return false;
  if (laterCount >= 2) return false;
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
  if (input.answer === "later") return recordLater(input.parent_id);
  const at = nowIstStamp();
  if (input.answer === "yes") {
    await query(
      `update parents set consent_status = 'given', consent_at = $2, recording_consent = true, consent_later_count = 0, paused = false where id = $1`,
      [input.parent_id, at],
    );
    await recordConsent(input.parent_id, "parent_voice", `spoken yes on ${input.call_sid}`);
    return { ok: true as const, status: "given" as const, paused: false, later_count: 0 };
  }
  await query(
    `update parents set consent_status = 'declined', consent_at = $2, recording_consent = false, paused = true where id = $1`,
    [input.parent_id, at],
  );
  await query(`delete from consents where parent_id = $1 and kind = $2`, [input.parent_id, "parent_voice"]);
  await notifyConsentDeclined(input.parent_id);
  return { ok: true as const, status: "declined" as const, paused: true, later_count: 0 };
}

async function recordLater(parentId: string) {
  const rows = await query<{ consent_status: string; consent_later_count: number; paused: boolean }>(
    `select consent_status, consent_later_count, paused from parents where id = $1`,
    [parentId],
  );
  const current = rows[0];
  if (!current) return { ok: false as const, error: "unknown_parent" };
  if (current.consent_status === "given") {
    return {
      ok: true as const,
      status: "given" as const,
      paused: current.paused,
      later_count: current.consent_later_count,
    };
  }
  if (current.consent_status === "declined") {
    return { ok: true as const, status: "declined" as const, paused: true, later_count: current.consent_later_count };
  }
  const next = Math.min(2, (current.consent_later_count ?? 0) + 1);
  await query(`update parents set consent_status = 'pending', consent_later_count = $2 where id = $1`, [
    parentId,
    next,
  ]);
  if (next >= 2) await notifyConsentLater(parentId);
  return { ok: true as const, status: "pending" as const, paused: false, later_count: next };
}

async function notifyConsentDeclined(parentId: string) {
  await notifyChild(parentId, "consent_declined");
}

async function notifyConsentLater(parentId: string) {
  await notifyChild(parentId, "consent_later");
}

async function notifyChild(parentId: string, kind: "consent_declined" | "consent_later") {
  const child = await query<{ phone: string; locale: string; first_name: string }>(
    `select phone, locale, first_name from contacts where parent_id = $1 and role = 'child' limit 1`,
    [parentId],
  );
  const parent = await query<{ first_name: string }>(`select first_name from parents where id = $1`, [parentId]);
  if (!child[0] || !parent[0]) return;
  const locale = child[0].locale === "hi" ? "hi" : "en";
  const intended =
    kind === "consent_later"
      ? locale === "hi"
        ? "consent_later_hi"
        : "consent_later_en"
      : locale === "hi"
        ? "consent_declined_hi"
        : "consent_declined_en";
  await sendFamilyMessage({
    parentId,
    toPhone: child[0].phone,
    locale,
    intended,
    vars: [parent[0].first_name],
    idempotencyKey: `${kind}_${parentId}`,
  });
}
