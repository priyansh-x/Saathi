import { connection } from "next/server";
import { toolAuthorized } from "@/lib/bolna/auth";
import { saveMemoryNote } from "@/lib/bolna/tools";
import { readJson, unauthorized } from "@/lib/http";

export async function POST(req: Request) {
  await connection();
  if (!toolAuthorized(req)) return unauthorized();
  const body = await readJson<{
    call_sid: string;
    parent_id: string;
    note: string;
    kind: "follow_up" | "stop" | "other";
  }>(req);
  if (!body?.call_sid || !body.parent_id || !body.note || !body.kind) {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  return Response.json(await saveMemoryNote(body));
}
