export const WAITLIST_RATE = 5;
export const WAITLIST_WINDOW_MS = 60_000;

const hits = new Map<string, number[]>();

export function resetWaitlistRateLimit() {
  hits.clear();
}

export function clientIp(req: { headers: Headers }) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "local";
}

export function allowWaitlistAttempt(ip: string, now = Date.now()) {
  const recent = (hits.get(ip) || []).filter((t) => now - t < WAITLIST_WINDOW_MS);
  if (recent.length >= WAITLIST_RATE) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

export function waitlistUnavailable(env: { NODE_ENV?: string; SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE_KEY?: string }) {
  if (env.NODE_ENV !== "production") return false;
  return !env.SUPABASE_URL?.trim() || !env.SUPABASE_SERVICE_ROLE_KEY?.trim();
}

export function isHoneypot(company?: string) {
  return Boolean(company && company.trim());
}
