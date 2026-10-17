import { connection } from "next/server";
import { cronAuthorized } from "@/lib/bolna/auth";
import { resolveTickClock, runDailyTick } from "@/lib/cron/tick";
import { unauthorized } from "@/lib/http";

export async function POST(req: Request) {
  await connection();
  if (!cronAuthorized(req)) return unauthorized();
  const body = (await req.json().catch(() => ({}))) as { elapsed_min?: number; now?: string };
  return Response.json(await runDailyTick(resolveTickClock(body)));
}
