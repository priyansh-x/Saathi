export const SW_VERSION = "saathi-pwa-v4";
export const DESK_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const CLEAR_CACHE_MESSAGE = "CLEAR_CACHE";
export const CACHED_AT_HEADER = "x-saathi-cached-at";

export function shouldCacheRequest(pathname: string, method = "GET") {
  if (method !== "GET") return false;
  if (pathname.startsWith("/api/")) return false;
  return true;
}

export function isDeskPath(pathname: string) {
  return /^\/d\/[^/]+/.test(pathname);
}

export function isCacheFresh(cachedAt: number, now: number, maxAge = DESK_MAX_AGE_MS) {
  if (!Number.isFinite(cachedAt) || cachedAt <= 0) return false;
  return now - cachedAt <= maxAge;
}

export async function clearOfflineCaches(store: { keys: () => Promise<string[]>; delete: (k: string) => Promise<boolean> }) {
  const keys = await store.keys();
  await Promise.all(keys.map((key) => store.delete(key)));
  return keys;
}

export function lastUpdatedBanner(cachedAt: number, lang: "en" | "hi") {
  const stamp = new Date(cachedAt).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });
  if (lang === "hi") return `आखिरी अपडेट ${stamp} · ऑफ़लाइन`;
  return `Last updated at ${stamp} · offline`;
}
