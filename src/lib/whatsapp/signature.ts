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
