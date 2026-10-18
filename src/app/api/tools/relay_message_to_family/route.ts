import { connection } from "next/server";
import { toolAuthorized } from "@/lib/bolna/auth";
import { relayMessage } from "@/lib/bolna/tools";
import { jsonOrLog, readJson, unauthorized } from "@/lib/http";

export async function POST(req: Request) {
  await connection();
  if (!toolAuthorized(req)) return unauthorized();
  const body = await readJson<{ call_sid: string; parent_id: string; message: string }>(req);
  if (!body?.call_sid || !body.parent_id || !body.message) {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  return jsonOrLog("tools.relay_message", { parent_id: body.parent_id, call_id: body.call_sid }, () =>
    relayMessage(body),
  );
}
