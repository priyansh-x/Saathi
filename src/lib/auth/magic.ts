import { allowedEmails, isMockEmail, publicBaseUrl } from "@/lib/config";
import { query } from "@/lib/db/client";
import { gateOutbound } from "@/lib/outbound";
import { canViewOps } from "@/lib/ops/access";
import { nowIstStamp } from "@/lib/time";
import { encodeSession, newAuthToken } from "./session";

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

/** Mock: issue a session immediately on localhost. Live: emailed link (and later, code). */
export async function startEmailSignIn(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  if (!validEmail(email)) return { ok: false as const, error: "Add a working email address." };

  const ops = canViewOps(email);
  if (process.env.NODE_ENV === "production" && isMockEmail() && !ops) {
    return { ok: false as const, error: NOT_CONFIGURED };
  }

  if (!canIssueSignIn(email)) return { ok: false as const, error: INVITE_ONLY };

  if (localMockSessionAllowed()) {
    return { ok: true as const, mode: "mock" as const, token: encodeSession(email) };
  }

  const gate = gateOutbound("email", email);
  if (!gate.ok && !ops) return { ok: false as const, error: INVITE_ONLY };

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { ok: false as const, error: NOT_CONFIGURED };
  }

  const token = newAuthToken();
  const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString().replace("Z", "+00:00");
  await query(`insert into auth_tokens (token, email, expires_at) values ($1,$2,$3)`, [token, email, expires]);

  const callback = `${publicBaseUrl()}/api/auth/callback?token=${encodeURIComponent(token)}`;
  const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/magiclink`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, options: { emailRedirectTo: callback } }),
  });
  if (!res.ok) return { ok: false as const, error: "Could not send the sign-in email." };
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
