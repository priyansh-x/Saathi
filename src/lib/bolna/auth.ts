import { bolnaWebhookSecret, cronSecret, isMockBolna, toolToken } from "@/lib/config";

export function bearerOk(req: Request, expected: string) {
  if (!expected) return false;
  const header = req.headers.get("authorization") || "";
  return header === `Bearer ${expected}` || header === expected || header === `Bearer Bearer ${expected}`;
}

function tokenFromRequest(req: Request) {
  const header = req.headers.get("authorization") || "";
  const alt = req.headers.get("x-api-token") || "";
  let query = "";
  try {
    query = new URL(req.url).searchParams.get("api_token") || "";
  } catch {
    query = "";
  }
  return { header, alt, query };
}

export function toolAuthorized(req: Request) {
  const expected = toolToken();
  if (!expected) return false;
  if (bearerOk(req, expected)) return true;
  const { alt, query } = tokenFromRequest(req);
  return alt === expected || alt === `Bearer ${expected}` || query === expected || query === `Bearer ${expected}`;
}

export function bolnaWebhookAuthorized(req: Request) {
  if (isMockBolna()) return toolAuthorized(req);
  const secret = bolnaWebhookSecret();
  if (!secret) return false;
  return bearerOk(req, secret);
}

export function cronAuthorized(req: Request) {
  return bearerOk(req, cronSecret());
}
