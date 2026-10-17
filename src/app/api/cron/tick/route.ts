import { connection } from "next/server";
import { cronAuthorized } from "@/lib/bolna/auth";
import { placeMorningCall } from "@/lib/bolna/place";
import { query } from "@/lib/db/client";
import { ensureSeed } from "@/lib/db/seed";
import { unauthorized } from "@/lib/http";
import { istDayKey } from "@/lib/time";

export async function POST(req: Request) {
  await connection();
  if (!cronAuthorized(req)) return unauthorized();
  await ensureSeed();
  const day = istDayKey();
  const parents = await query<{ id: string; paused: boolean }>(
    `select id, paused from parents where paused = false`,
  );
  const results = [];
  for (const parent of parents) {
    const existing = await query<{ n: number }>(
      `select count(*)::int as n from calls where parent_id = $1 and started_at like $2 and status in ('completed','in_progress','no_conversation')`,
      [parent.id, `${day}%`],
    );
    if ((existing[0]?.n ?? 0) > 0) {
      results.push({ parent_id: parent.id, skipped: "already_called" });
      continue;
    }
    results.push({ parent_id: parent.id, ...(await placeMorningCall(parent.id)) });
  }
  return Response.json({ ok: true, day, results });
}
