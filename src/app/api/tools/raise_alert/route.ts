import { connection } from "next/server";
import { toolAuthorized } from "@/lib/bolna/auth";
import { raiseAlert } from "@/lib/bolna/tools";
import { jsonOrLog, readJson, unauthorized } from "@/lib/http";

export async function POST(req: Request) {
  await connection();
  if (!toolAuthorized(req)) return unauthorized();
  const body = await readJson<{
    call_sid: string;
    parent_id: string;
    category: "EMERGENCY" | "URGENT" | "ATTENTION" | "SCAM_CONCERN" | "REFILL";
    quote: string;
    late?: boolean;
  }>(req);
  if (!body?.call_sid || !body.parent_id || !body.category || !body.quote) {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  return jsonOrLog("tools.raise_alert", { parent_id: body.parent_id, call_id: body.call_sid }, () => raiseAlert(body));
}
