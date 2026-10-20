import { connection } from "next/server";
import { bolnaWebhookAuthorized } from "@/lib/bolna/auth";
import { bolnaExecutionId } from "@/lib/bolna/execution";
import type { BolnaWebhook } from "@/lib/bolna/webhook";
import { parseWebhook } from "@/lib/calls/provider";
import { jsonOrLog, readJson, unauthorized } from "@/lib/http";

export async function handleBolnaWebhookPost(req: Request) {
  if (!bolnaWebhookAuthorized(req)) return unauthorized();
  const body = await readJson<BolnaWebhook & { execution_id?: string; data?: BolnaWebhook }>(req);
  const payload = body?.data && typeof body.data === "object" ? { ...body, ...body.data } : body;
  const executionId = bolnaExecutionId(payload);
  if (!payload || !executionId) {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  return jsonOrLog("webhooks.bolna", { execution_id: executionId }, () => parseWebhook(payload, executionId));
}

export async function POST(req: Request) {
  await connection();
  return handleBolnaWebhookPost(req);
}
