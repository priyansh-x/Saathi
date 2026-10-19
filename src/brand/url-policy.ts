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
