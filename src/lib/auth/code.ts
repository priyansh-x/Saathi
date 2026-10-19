import { createHash, randomInt } from "node:crypto";
import { isMockEmail } from "@/lib/config";
import { query } from "@/lib/db/client";
import { gateOutbound } from "@/lib/outbound";
import { canViewOps } from "@/lib/ops/access";
import { nowIstStamp } from "@/lib/time";
import { encodeSession } from "./session";

const TTL_MS = 10 * 60 * 1000;
const MAX_TRIES = 5;
const ISSUE_WINDOW_MS = 10 * 60 * 1000;
const ISSUE_MAX = 5;
const issueHits = new Map<string, number[]>();

function pepper() {
  return process.env.SESSION_SECRET || process.env.MAGIC_LINK_SECRET || "dev-code-pepper";
}

export function hashSignInCode(email: string, code: string) {
  return createHash("sha256").update(`${pepper()}:${email}:${code}`).digest("hex");
}

function sixDigit() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function allowIssue(email: string, now = Date.now()) {
  const hits = (issueHits.get(email) || []).filter((t) => now - t < ISSUE_WINDOW_MS);
  if (hits.length >= ISSUE_MAX) return false;
  hits.push(now);
  issueHits.set(email, hits);
  return true;
}

export async function issueSignInCode(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  const gate = gateOutbound("email", email);
  if (!gate.ok && !canViewOps(email)) return { ok: false as const, error: "Pilot is invite-only for now" };
  if (!allowIssue(email)) return { ok: false as const, error: "Wait a few minutes, then try again." };

  const code = sixDigit();
  const expires = new Date(Date.now() + TTL_MS).toISOString().replace("Z", "+00:00");
  const id = `code_${Date.now()}_${randomInt(1e6, 9e6)}`;
  await query(
    `insert into auth_codes (id, email, code_hash, code_plain, expires_at, tries, created_at)
     values ($1,$2,$3,$4,$5,0,$6)`,
    [id, email, hashSignInCode(email, code), isMockEmail() ? code : null, expires, nowIstStamp()],
  );
  return { ok: true as const, email, code, expires, plainForOps: isMockEmail() };
}

export async function verifySignInCode(rawEmail: string, rawCode: string) {
  const email = rawEmail.trim().toLowerCase();
  const code = rawCode.replace(/\D/g, "");
  if (!/^\d{6}$/.test(code)) return null;
  const rows = await query<{
    id: string;
    code_hash: string;
    expires_at: string;
    tries: number;
    consumed_at: string | null;
  }>(
    `select id, code_hash, expires_at, tries, consumed_at from auth_codes
     where email = $1 and consumed_at is null
     order by created_at desc limit 1`,
    [email],
  );
  const row = rows[0];
  if (!row) return null;
  if (row.tries >= MAX_TRIES) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  if (row.code_hash !== hashSignInCode(email, code)) {
    await query(`update auth_codes set tries = tries + 1 where id = $1`, [row.id]);
    return null;
  }
  await query(`update auth_codes set consumed_at = $2, tries = tries + 1 where id = $1`, [row.id, nowIstStamp()]);
  return encodeSession(email);
}

export async function listMockPendingCodes() {
  if (!isMockEmail()) return [];
  const rows = await query<{ email: string; code_plain: string | null; expires_at: string }>(
    `select email, code_plain, expires_at from auth_codes
     where consumed_at is null and code_plain is not null
     order by created_at desc limit 20`,
  );
  const now = Date.now();
  return rows
    .filter((row) => row.code_plain && new Date(row.expires_at).getTime() > now)
    .filter((row) => gateOutbound("email", row.email).ok)
    .map((row) => ({ email: row.email, code: row.code_plain as string, expiresAt: row.expires_at }));
}
