function supabaseAuth() {
  const url = (process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
  const key = (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) return null;
  return { url, key };
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
  if (!res.ok) return { ok: false as const, error: "Could not send the sign-in email." };
  return { ok: true as const };
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
