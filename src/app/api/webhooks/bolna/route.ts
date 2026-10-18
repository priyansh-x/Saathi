import { connection } from "next/server";
import { bolnaWebhookAuthorized } from "@/lib/bolna/auth";
import type { BolnaWebhook } from "@/lib/bolna/webhook";
import { parseWebhook } from "@/lib/calls/provider";
import { jsonOrLog, readJson, unauthorized } from "@/lib/http";

export async function POST(req: Request) {
  await connection();
  if (!bolnaWebhookAuthorized(req)) return unauthorized();
  const body = await readJson<BolnaWebhook & { execution_id?: string }>(req);
  const executionId = body?.execution_id || body?.id;
  if (!body || !executionId) {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  return jsonOrLog("webhooks.bolna", { execution_id: executionId }, () => parseWebhook(body, executionId));
}
