import { createHmac, timingSafeEqual } from "node:crypto";
import { canViewOps, opsEmails } from "@/lib/ops/access";
import { sessionSecret } from "@/lib/config";

export const ADMIN_COOKIE = "saathi_admin";
const MAX_AGE_SEC = 60 * 60 * 12;

export function adminPassword() {
  return (process.env.ADMIN_PASSWORD || "").trim();
}

export function adminEnabled() {
  return Boolean(adminPassword()) || opsEmails().length > 0;
}

function hmac(payload: string) {
  return createHmac("sha256", sessionSecret() || "dev-admin").update(payload).digest("base64url");
}

export function encodeAdminCookie(now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ admin: true, exp: now + MAX_AGE_SEC * 1000 })).toString("base64url");
  return `${payload}.${hmac(payload)}`;
}

export function verifyAdminCookie(token: string | undefined | null, now = Date.now()) {
  if (!token || !token.includes(".")) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  try {
    const expected = hmac(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    const body = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { admin?: boolean; exp?: number };
    return body.admin === true && typeof body.exp === "number" && body.exp >= now;
  } catch {
    return false;
  }
}

export function adminCookieHeader(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${secure}`;
}

export function clearAdminCookieHeader() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function passwordsMatch(given: string, expected = adminPassword()) {
  if (!expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(a.length ? a : Buffer.from("x"), a.length ? a : Buffer.from("x"));
    return false;
  }
  return timingSafeEqual(a, b);
}

export function canOpenAdmin(args: { cookie?: string | null; email?: string | null }) {
  if (verifyAdminCookie(args.cookie)) return { ok: true as const, via: "password" as const };
  if (canViewOps(args.email)) return { ok: true as const, via: "ops" as const };
  return { ok: false as const };
}

/** Only same-origin /admin paths. Blocks open redirects from the action form. */
export function safeAdminNext(raw: string | null | undefined) {
  const next = (raw || "/admin").trim();
  if (!next.startsWith("/admin")) return "/admin";
  if (next.startsWith("//") || next.includes("://") || next.includes("\\")) return "/admin";
  return next;
}
