export type AppUrlKind = "in-app" | "dialer" | "external";

export function classifyAppUrl(raw: string, allowedHost: string): AppUrlKind {
  const value = raw.trim();
  if (value.startsWith("tel:")) return "dialer";
  if (value.startsWith("mailto:") || value.startsWith("sms:")) return "external";
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return "external";
  }
  if (url.protocol === "tel:") return "dialer";
  const host = url.hostname.toLowerCase();
  if (host === allowedHost.toLowerCase()) return "in-app";
  return "external";
}

export function isTodayPath(pathname: string) {
  return /^\/d\/[^/]+\/?$/.test(pathname);
}

/** Offline Retry: https on the configured host. http only for emulator loopback. */
export function retryUrl(raw: string, allowedHost: string) {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (host !== allowedHost.toLowerCase()) return null;
    const loopback = host === "10.0.2.2" || host === "localhost" || host === "127.0.0.1";
    if (url.protocol === "https:") return url.toString();
    if (url.protocol === "http:" && loopback) return url.toString();
    return null;
  } catch {
    return null;
  }
}
