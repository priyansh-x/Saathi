import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { allowedEmails, sessionSecret } from "@/lib/config";
import { query } from "@/lib/db/client";
import { canViewOps } from "@/lib/ops/access";
import { nowIstStamp } from "@/lib/time";
import { encodeSession } from "./session";

const TTL_MS = 10 * 60 * 1000;
const MAX_TRIES = 5;
const ISSUE_WINDOW_MS = 10 * 60 * 1000;
const ISSUE_MAX = 5;

function pepper() {
  const secret = sessionSecret();
  if (!secret) throw new Error("SESSION_SECRET is required to issue sign-in codes.");
  return secret;
}

export function hashSignInCode(email: string, code: string) {
  return createHash("sha256").update(`${pepper()}:${email}:${code}`).digest("hex");
}

function hashesEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function sixDigit() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function canIssueSignIn(email: string) {
  const n = email.trim().toLowerCase();
  return allowedEmails().includes(n) || canViewOps(n);
}

export async function countRecentCodes(email: string, now = Date.now()) {
  const since = now - ISSUE_WINDOW_MS;
  const rows = await query<{ n: number }>(
    `select count(*)::int as n from auth_codes where email = $1 and issued_at >= $2`,
    [email, since],
  );
  return rows[0]?.n ?? 0;
}

export function mintSignInCode() {
  return sixDigit();
}

export async function persistSignInCode(rawEmail: string, code: string, now = Date.now()) {
  const email = rawEmail.trim().toLowerCase();
  if (!canIssueSignIn(email)) return { ok: false as const, error: "Pilot is invite-only for now" };
  if ((await countRecentCodes(email, now)) >= ISSUE_MAX) {
    return { ok: false as const, error: "Wait a few minutes, then try again." };
  }
  const expires = new Date(now + TTL_MS).toISOString().replace("Z", "+00:00");
  const id = `code_${now}_${randomInt(1e6, 9e6)}`;
  const plain = process.env.NODE_ENV === "production" ? null : code;
  await query(
    `insert into auth_codes (id, email, code_hash, code_plain, expires_at, tries, created_at, issued_at)
     values ($1,$2,$3,$4,$5,0,$6,$7)`,
    [id, email, hashSignInCode(email, code), plain, expires, nowIstStamp(new Date(now)), now],
  );
  return { ok: true as const, email, code, expires, plainForOps: Boolean(plain) };
}

/** @deprecated generate then persist only after mail is accepted */
export async function issueSignInCode(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  if (!canIssueSignIn(email)) return { ok: false as const, error: "Pilot is invite-only for now" };
  if ((await countRecentCodes(email)) >= ISSUE_MAX) {
    return { ok: false as const, error: "Wait a few minutes, then try again." };
  }
  return persistSignInCode(email, mintSignInCode());
}

export async function verifySignInCode(rawEmail: string, rawCode: string) {
  const email = rawEmail.trim().toLowerCase();
  if (!canIssueSignIn(email)) return null;
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
     where email = $1 and consumed_at is null and issued_at is not null
     order by issued_at desc, id desc limit 1`,
    [email],
  );
  const row = rows[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  const bumped = await query<{ tries: number }>(
    `update auth_codes set tries = tries + 1 where id = $1 and tries < $2 returning tries`,
    [row.id, MAX_TRIES],
  );
  if (!bumped[0]) return null;
  if (!hashesEqual(row.code_hash, hashSignInCode(email, code))) return null;
  await query(`update auth_codes set consumed_at = $2 where id = $1`, [row.id, nowIstStamp()]);
  return encodeSession(email);
}

export async function listMockPendingCodes() {
  if (process.env.NODE_ENV === "production") return [];
  const rows = await query<{ email: string; code_plain: string | null; expires_at: string }>(
    `select email, code_plain, expires_at from auth_codes
     where consumed_at is null and code_plain is not null
     order by created_at desc limit 20`,
  );
  const now = Date.now();
  return rows
    .filter((row) => row.code_plain && new Date(row.expires_at).getTime() > now)
    .filter((row) => canIssueSignIn(row.email))
    .map((row) => ({ email: row.email, code: row.code_plain as string, expiresAt: row.expires_at }));
}
