import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyWhatsappSignature(rawBody: string, header: string | null, secret: string) {
  if (!secret || !header) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody, "utf8").digest("hex")}`;
  const left = Buffer.from(header);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function signWhatsappBody(rawBody: string, secret: string) {
  return `sha256=${createHmac("sha256", secret).update(rawBody, "utf8").digest("hex")}`;
}

export function authorizeWhatsappPost(args: {
  mock: boolean;
  secret: string;
  header: string | null;
  raw: string;
}): { ok: true } | { ok: false; status: 401; reason: "missing_app_secret" | "bad_signature" } {
  if (args.mock) return { ok: true };
  if (!args.secret) return { ok: false, status: 401, reason: "missing_app_secret" };
  if (!verifyWhatsappSignature(args.raw, args.header, args.secret)) {
    return { ok: false, status: 401, reason: "bad_signature" };
  }
  return { ok: true };
}
