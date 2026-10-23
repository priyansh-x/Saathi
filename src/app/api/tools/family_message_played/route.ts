import { connection } from "next/server";
import { toolAuthorized } from "@/lib/bolna/auth";
import { familyMessagePlayedTool } from "@/lib/bolna/tools";
import { jsonOrLog, readJson, unauthorized } from "@/lib/http";

export async function POST(req: Request) {
  await connection();
  if (!toolAuthorized(req)) return unauthorized();
  const body = await readJson<{
    call_sid: string;
    parent_id: string;
    family_message_id: string;
  }>(req);
  if (!body?.call_sid || !body.parent_id || !body.family_message_id) {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  return jsonOrLog("tools.family_message_played", { parent_id: body.parent_id, call_id: body.call_sid }, () =>
    familyMessagePlayedTool(body),
  );
}
