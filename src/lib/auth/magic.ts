import { allowedEmails, isMockEmail, publicBaseUrl } from "@/lib/config";
import { query } from "@/lib/db/client";
import { deliverEmail } from "@/lib/email/transport";
import { emailMaySignIn } from "@/lib/members";
import { canViewOps } from "@/lib/ops/access";
import { nowIstStamp } from "@/lib/time";
import { countRecentCodes, mintSignInCode, persistSignInCode } from "./code";
import { encodeSession, newAuthToken } from "./session";
import { sendSupabaseEmailOtp } from "./supabase-otp";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "10.0.2.2"]);

export function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

export function validEmail(raw: string) {
  return EMAIL.test(normalizeEmail(raw));
}

export function isLocalPublicBase(raw = publicBaseUrl()) {
  try {
    return LOCAL_HOSTS.has(new URL(raw).hostname);
  } catch {
    return false;
  }
}

/** Instant mock cookie: local Next only. Never on a public NODE_ENV=production host. */
export function localMockSessionAllowed() {
  if (!isMockEmail()) return false;
  if (process.env.NODE_ENV === "production") return false;
  return isLocalPublicBase();
}

export function canIssueSignIn(email: string) {
  const n = normalizeEmail(email);
  return allowedEmails().includes(n) || canViewOps(n);
}

const NOT_CONFIGURED = "Email sign-in is not configured.";
const INVITE_ONLY = "Pilot is invite-only for now";

/** Localhost mock cookie, or emailed link + 6-digit code. Never a cookie without proof on production. */
export async function startEmailSignIn(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  if (!validEmail(email)) return { ok: false as const, error: "Add a working email address." };

  if (!(await emailMaySignIn(email))) return { ok: false as const, error: INVITE_ONLY };

  if (localMockSessionAllowed()) {
    return { ok: true as const, mode: "mock" as const, token: encodeSession(email) };
  }

  const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
  const supabaseKey = (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const productionMock = process.env.NODE_ENV === "production" && isMockEmail();
  if (productionMock && (!supabaseUrl || !supabaseKey)) {
    return { ok: false as const, error: NOT_CONFIGURED };
  }

  if ((await countRecentCodes(email)) >= 5) {
    return { ok: false as const, error: "Wait a few minutes, then try again." };
  }

  const code = mintSignInCode();
  const token = newAuthToken();
  const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString().replace("Z", "+00:00");
  await query(`insert into auth_tokens (token, email, expires_at) values ($1,$2,$3)`, [token, email, expires]);

  const callback = `${publicBaseUrl()}/api/auth/callback?token=${encodeURIComponent(token)}`;
  const text = [
    "Saathi sign-in",
    "",
    `Your code is ${code}. It lasts 10 minutes (5 tries).`,
    "",
    "Or open this link on this phone:",
    callback,
  ].join("\n");

  const sent = productionMock
    ? await sendSupabaseEmailOtp(email)
    : await deliverEmail({ to: email, subject: "Saathi sign-in code", text });
  if (!sent.ok) {
    if (productionMock) return { ok: false as const, error: sent.error || NOT_CONFIGURED };
    if (!supabaseUrl || !supabaseKey) return { ok: false as const, error: NOT_CONFIGURED };
    const otp = await sendSupabaseEmailOtp(email);
    if (!otp.ok) return { ok: false as const, error: otp.error || NOT_CONFIGURED };
  }
  const stored = await persistSignInCode(email, code);
  if (!stored.ok) return stored;
  return { ok: true as const, mode: "email" as const };
}

export async function consumeAuthToken(token: string) {
  const rows = await query<{ email: string; expires_at: string; consumed_at: string | null }>(
    `select email, expires_at, consumed_at from auth_tokens where token = $1`,
    [token],
  );
  const row = rows[0];
  if (!row || row.consumed_at) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  await query(`update auth_tokens set consumed_at = $2 where token = $1`, [token, nowIstStamp()]);
  return encodeSession(row.email);
}
