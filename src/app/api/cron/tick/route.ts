import { connection } from "next/server";
import { cronAuthorized } from "@/lib/bolna/auth";
import { runDailyTick } from "@/lib/cron/tick";
import { unauthorized } from "@/lib/http";

export async function POST(req: Request) {
  await connection();
  if (!cronAuthorized(req)) return unauthorized();
  const body = (await req.json().catch(() => ({}))) as { elapsed_min?: number; now?: string };
  const now = body.now ? new Date(body.now) : new Date();
  return Response.json(await runDailyTick({ now, elapsedMin: body.elapsed_min }));
}
