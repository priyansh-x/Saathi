const WINDOW_MS = 10 * 60 * 1000;
const MAX = 10;
const hits = new Map<string, number[]>();

export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

export function allowIp(ip: string, now = Date.now()) {
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX) return false;
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

export function resetIpLimitForTests() {
  hits.clear();
}
