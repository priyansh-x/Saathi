import { connection } from "next/server";
import { toolAuthorized } from "@/lib/bolna/auth";
import { recordSpokenConsent } from "@/lib/consent";
import { readJson, unauthorized } from "@/lib/http";

export async function POST(req: Request) {
  await connection();
  if (!toolAuthorized(req)) return unauthorized();
  const body = await readJson<{ call_sid: string; parent_id: string; answer: "yes" | "no" }>(req);
  if (!body?.call_sid || !body.parent_id || (body.answer !== "yes" && body.answer !== "no")) {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  return Response.json(await recordSpokenConsent(body));
}
