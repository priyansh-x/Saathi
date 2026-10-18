import { isMockWhatsapp, publicBaseUrl } from "@/lib/config";
import { query } from "@/lib/db/client";
import { gateOutbound } from "@/lib/outbound";
import { nowIstStamp } from "@/lib/time";
import { encodeSession, newAuthToken } from "./session";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

export function validEmail(raw: string) {
  return EMAIL.test(normalizeEmail(raw));
}

/** Mock: issue a session immediately. Live: store a token and ask Supabase Auth to email a link. */
export async function startEmailSignIn(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  if (!validEmail(email)) return { ok: false as const, error: "Add a working email address." };

  if (isMockWhatsapp()) {
    return { ok: true as const, mode: "mock" as const, token: encodeSession(email) };
  }

  const gate = gateOutbound("email", email);
  if (!gate.ok) return { ok: false as const, error: "That email is not on the allowlist." };

  const token = newAuthToken();
  const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString().replace("Z", "+00:00");
  await query(`insert into auth_tokens (token, email, expires_at) values ($1,$2,$3)`, [token, email, expires]);

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { ok: false as const, error: "Email sign-in is not configured." };
  }

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
