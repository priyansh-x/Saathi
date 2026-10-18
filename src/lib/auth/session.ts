import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { isMockWhatsapp } from "@/lib/config";

export const SESSION_COOKIE = "saathi_child";
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

function secret() {
  return process.env.MAGIC_LINK_SECRET || (isMockWhatsapp() ? "dev-magic" : "");
}

function sign(payload: string) {
  const key = secret();
  if (!key) throw new Error("MAGIC_LINK_SECRET is required when mocks are off.");
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export type ChildSession = { email: string; exp: number };

export function encodeSession(email: string, now = Date.now()): string {
  const body: ChildSession = { email: email.trim().toLowerCase(), exp: now + MAX_AGE_SEC * 1000 };
  const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | undefined | null, now = Date.now()): ChildSession | null {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const expected = sign(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const body = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as ChildSession;
    if (!body.email || typeof body.exp !== "number" || body.exp < now) return null;
    return body;
  } catch {
    return null;
  }
}

export function sessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${secure}`;
}

export function newAuthToken() {
  return `m_${randomBytes(16).toString("hex")}`;
}
