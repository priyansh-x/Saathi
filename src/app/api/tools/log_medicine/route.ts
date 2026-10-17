import { connection } from "next/server";
import { toolAuthorized } from "@/lib/bolna/auth";
import { logMedicine } from "@/lib/bolna/tools";
import { readJson, unauthorized } from "@/lib/http";

export async function POST(req: Request) {
  await connection();
  if (!toolAuthorized(req)) return unauthorized();
  const body = await readJson<{
    call_sid: string;
    parent_id: string;
    medicine_id?: string;
    medicine_name?: string;
    status: "taken" | "not_taken" | "not_sure";
    said?: string;
  }>(req);
  if (!body?.call_sid || !body.parent_id || !body.status) {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const result = await logMedicine(body);
  return Response.json(result);
}
