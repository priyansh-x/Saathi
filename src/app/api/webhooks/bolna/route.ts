import { connection } from "next/server";
import { toolAuthorized } from "@/lib/bolna/auth";
import { processBolnaWebhook, type BolnaWebhook } from "@/lib/bolna/webhook";
import { readJson, unauthorized } from "@/lib/http";

export async function POST(req: Request) {
  await connection();
  if (!toolAuthorized(req)) return unauthorized();
  const body = await readJson<BolnaWebhook & { execution_id?: string }>(req);
  const executionId = body?.execution_id || body?.id;
  if (!body || !executionId) {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  return Response.json(await processBolnaWebhook(body, executionId));
}
