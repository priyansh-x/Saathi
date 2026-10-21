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
    body: JSON.stringify({ email }),
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

function firstParam(from: URLSearchParams, ...keys: string[]) {
  for (const key of keys) {
    const value = from.get(key)?.trim();
    if (value) return value;
  }
  return "";
}

export function parseSupabaseAuthLink(raw: string) {
  const trimmed = raw.trim().replace(/^<|>$/g, "");
  if (!trimmed) return null;
  const found = trimmed.match(/https?:\/\/[^\s<>"']+/i)?.[0]?.replace(/&amp;/g, "&") || trimmed;
  try {
    const url = new URL(found);
    const hash = new URLSearchParams(url.hash.replace(/^#/, "").replace(/&amp;/g, "&"));
    const token =
      firstParam(url.searchParams, "token_hash", "token") || firstParam(hash, "token_hash", "token");
    const accessToken = firstParam(hash, "access_token") || firstParam(url.searchParams, "access_token");
    const type = firstParam(url.searchParams, "type") || firstParam(hash, "type") || "magiclink";
    if (!token && !accessToken) return null;
    return { token, type, accessToken };
  } catch {
    if (/^[A-Za-z0-9._-]{20,}$/.test(trimmed)) {
      return { token: trimmed, type: "magiclink", accessToken: "" };
    }
    return null;
  }
}

async function emailFromVerify(auth: { url: string; key: string }, body: Record<string, string>) {
  const res = await fetch(`${auth.url}/auth/v1/verify`, {
    method: "POST",
    headers: {
      apikey: auth.key,
      Authorization: `Bearer ${auth.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const payload = (await res.json().catch(() => ({}))) as { user?: { email?: string } };
  const email = payload.user?.email?.trim().toLowerCase();
  return email || null;
}

async function emailFromAccessToken(auth: { url: string; key: string }, accessToken: string) {
  const res = await fetch(`${auth.url}/auth/v1/user`, {
    headers: {
      apikey: auth.key,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) return null;
  const payload = (await res.json().catch(() => ({}))) as { email?: string };
  return payload.email?.trim().toLowerCase() || null;
}

export async function consumeSupabaseAuthLink(raw: string) {
  const parsed = parseSupabaseAuthLink(raw);
  const auth = supabaseAuth();
  if (!parsed || !auth) return null;
  const types = [parsed.type, "magiclink", "signup", "email"].filter(
    (value, index, all) => value && all.indexOf(value) === index,
  );
  if (parsed.token) {
    for (const type of types) {
      const email =
        (await emailFromVerify(auth, { type, token_hash: parsed.token })) ||
        (await emailFromVerify(auth, { type, token: parsed.token }));
      if (email) return { email };
    }
  }
  if (parsed.accessToken) {
    const email = await emailFromAccessToken(auth, parsed.accessToken);
    if (email) return { email };
  }
  return null;
}
