import { connection } from "next/server";
import { toolAuthorized } from "@/lib/bolna/auth";
import { saveFamilyReplyTool } from "@/lib/bolna/tools";
import { jsonOrLog, readJson, unauthorized } from "@/lib/http";

export async function POST(req: Request) {
  await connection();
  if (!toolAuthorized(req)) return unauthorized();
  const body = await readJson<{
    call_sid: string;
    parent_id: string;
    family_message_id: string;
    reply: string;
  }>(req);
  if (!body?.call_sid || !body.parent_id || !body.family_message_id || !body.reply) {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  return jsonOrLog("tools.save_family_reply", { parent_id: body.parent_id, call_id: body.call_sid }, () =>
    saveFamilyReplyTool(body),
  );
}
