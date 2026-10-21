import { connection } from "next/server";
import { cronAuthorized } from "@/lib/bolna/auth";
import { resolveTickClock, runDailyTick } from "@/lib/cron/tick";
import { jsonOrLog, unauthorized } from "@/lib/http";

async function handleTick(req: Request) {
  if (!cronAuthorized(req)) return unauthorized();
  const body = (await req.json().catch(() => ({}))) as { elapsed_min?: number; now?: string };
  return jsonOrLog("cron.tick", { route: "tick" }, () => runDailyTick(resolveTickClock(body)));
}

export async function GET(req: Request) {
  await connection();
  return handleTick(req);
}

export async function POST(req: Request) {
  await connection();
  return handleTick(req);
}
