import { allowedEmails, isMockEmail, publicBaseUrl } from "@/lib/config";
import { deliverSignInOtp, signInOtpConfigured } from "@/lib/email/gmail-otp";
import { emailMaySignIn } from "@/lib/members";
import { canViewOps } from "@/lib/ops/access";
import { nowIstStamp } from "@/lib/time";
import { countRecentCodes, mintSignInCode, persistSignInCode } from "./code";
import { encodeSession } from "./session";
import { query } from "@/lib/db/client";

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

/** Localhost mock cookie, or a 6-digit code from EMAIL_FROM. */
export async function startEmailSignIn(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  if (!validEmail(email)) return { ok: false as const, error: "Add a working email address." };

  if (!(await emailMaySignIn(email))) return { ok: false as const, error: INVITE_ONLY };

  if (localMockSessionAllowed()) {
    return { ok: true as const, mode: "mock" as const, token: encodeSession(email) };
  }

  if (!signInOtpConfigured()) {
    return { ok: false as const, error: NOT_CONFIGURED };
  }

  if ((await countRecentCodes(email)) >= 5) {
    return { ok: false as const, error: "Wait a few minutes, then try again." };
  }

  const code = mintSignInCode();
  const sent = await deliverSignInOtp(email, code);
  if (!sent.ok) {
    if (sent.error.startsWith("smtp_5") || sent.error === "gmail_oauth") {
      return {
        ok: false as const,
        error: "Gmail rejected the mail login. Use the 16-character App Password as SMTP_PASS, then Redeploy.",
      };
    }
    return { ok: false as const, error: `Could not send the sign-in email from Gmail (${sent.error}).` };
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
