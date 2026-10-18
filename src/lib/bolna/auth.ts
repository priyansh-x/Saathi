import { bolnaWebhookSecret, cronSecret, isMockBolna, toolToken } from "@/lib/config";

export function bearerOk(req: Request, expected: string) {
  if (!expected) return false;
  const header = req.headers.get("authorization") || "";
  return header === `Bearer ${expected}` || header === expected || header === `Bearer Bearer ${expected}`;
}

export function toolAuthorized(req: Request) {
  const expected = toolToken();
  if (!expected) return false;
  if (bearerOk(req, expected)) return true;
  const alt = req.headers.get("x-api-token") || "";
  return alt === expected || alt === `Bearer ${expected}`;
}

/**
 * Live Bolna webhooks: require the Authorization header (Bolna dashboard
 * Extractions → Add headers). The v2 agent API has webhook_url only — no
 * webhook_headers field — so Priyansh sets
 * `{"Authorization":"Bearer <BOLNA_WEBHOOK_SECRET>"}` in the dashboard.
 * Docs also list source IPs; we use the documented custom header first.
 * Requests without the header are rejected.
 */
export function bolnaWebhookAuthorized(req: Request) {
  if (isMockBolna()) return toolAuthorized(req);
  const secret = bolnaWebhookSecret();
  if (!secret) return false;
  return bearerOk(req, secret);
}

export function cronAuthorized(req: Request) {
  return bearerOk(req, cronSecret());
}
