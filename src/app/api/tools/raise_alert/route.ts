import { connection } from "next/server";
import { toolAuthorized } from "@/lib/bolna/auth";
import { raiseAlert } from "@/lib/bolna/tools";
import { readJson, unauthorized } from "@/lib/http";

export async function POST(req: Request) {
  await connection();
  if (!toolAuthorized(req)) return unauthorized();
  const body = await readJson<{
    call_sid: string;
    parent_id: string;
    category: "EMERGENCY" | "URGENT" | "ATTENTION";
    quote: string;
    late?: boolean;
  }>(req);
  if (!body?.call_sid || !body.parent_id || !body.category || !body.quote) {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  return Response.json(await raiseAlert(body));
}
