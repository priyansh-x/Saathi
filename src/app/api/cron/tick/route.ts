import { connection } from "next/server";
import { cronAuthorized } from "@/lib/bolna/auth";
import { placeMorningCall } from "@/lib/bolna/place";
import { killSwitchOn } from "@/lib/config";
import { query } from "@/lib/db/client";
import { ensureSeed } from "@/lib/db/seed";
import { unauthorized } from "@/lib/http";
import { advanceLadder } from "@/lib/ladder";
import { istDayKey } from "@/lib/time";

export async function POST(req: Request) {
  await connection();
  if (!cronAuthorized(req)) return unauthorized();
  if (killSwitchOn()) {
    return Response.json({ ok: false, halted: true, reason: "kill_switch" });
  }
  await ensureSeed();
  const day = istDayKey();
  const body = (await req.json().catch(() => ({}))) as { elapsed_min?: number };
  const elapsed = body.elapsed_min;
  const parents = await query<{ id: string; paused: boolean }>(
    `select id, paused from parents where paused = false`,
  );
  const results = [];
  for (const parent of parents) {
    const open = await query<{ id: string; started_at: string; status: string }>(
      `select id, started_at, status from calls
       where parent_id = $1 and started_at like $2 and status in ('missed','in_progress')
       order by started_at desc limit 1`,
      [parent.id, `${day}%`],
    );
    if (open[0]) {
      const mins =
        elapsed ??
        Math.max(0, Math.floor((Date.now() - new Date(open[0].started_at).getTime()) / 60000));
      results.push({
        parent_id: parent.id,
        ladder: await advanceLadder({ parentId: parent.id, callId: open[0].id, elapsedMin: mins }),
      });
      continue;
    }
    const existing = await query<{ n: number }>(
      `select count(*)::int as n from calls where parent_id = $1 and started_at like $2 and status in ('completed','no_conversation')`,
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
