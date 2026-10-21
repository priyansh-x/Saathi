const RATE_LIMIT =
  "Too many sign-in emails. Wait about an hour, then try again. Ignore any mail that opens localhost.";

function supabaseAuth() {
  const url = (process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
  const key = (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) return null;
  return { url, key };
}

function errorPayload(status: number, body: unknown) {
  const rec = body && typeof body === "object" ? (body as { error_code?: unknown; msg?: unknown; message?: unknown }) : {};
  const code = typeof rec.error_code === "string" ? rec.error_code : "";
  const msg = typeof rec.msg === "string" ? rec.msg : typeof rec.message === "string" ? rec.message : "";
  if (status === 429 || code === "over_email_send_rate_limit" || /rate limit/i.test(msg)) {
    return { ok: false as const, error: RATE_LIMIT, rateLimited: true as const };
  }
  return { ok: false as const, error: "Could not send the sign-in email." };
}

export async function sendSupabaseEmailOtp(email: string) {
  const auth = supabaseAuth();
  if (!auth) return { ok: false as const, error: "Email sign-in is not configured." };
  const res = await fetch(`${auth.url}/auth/v1/otp`, {
    method: "POST",
    headers: {
      apikey: auth.key,
      Authorization: `Bearer ${auth.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, create_user: true }),
  });
  if (res.ok) return { ok: true as const };
  const body = await res.json().catch(() => ({}));
  return errorPayload(res.status, body);
}

export async function verifySupabaseEmailOtp(email: string, code: string) {
  const auth = supabaseAuth();
  if (!auth) return false;
  const res = await fetch(`${auth.url}/auth/v1/verify`, {
    method: "POST",
    headers: {
      apikey: auth.key,
      Authorization: `Bearer ${auth.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "email", email, token: code }),
  });
  return res.ok;
}
