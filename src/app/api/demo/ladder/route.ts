import { connection } from "next/server";
import { isMockBolna } from "@/lib/config";
import { query } from "@/lib/db/client";
import { ensureSeed } from "@/lib/db/seed";
import { readJson } from "@/lib/http";
import { advanceLadder } from "@/lib/ladder";
import { runMockScenario } from "@/lib/bolna/mock-run";
import { istDayBounds, istDayKey } from "@/lib/time";

export async function POST(req: Request) {
  await connection();
  if (!isMockBolna()) return Response.json({ ok: false, error: "mock_disabled" }, { status: 403 });
  await ensureSeed();
  const body = await readJson<{ parent_id?: string; elapsed_min?: number; start?: boolean }>(req);
  const parentId = body?.parent_id ?? "parent_kamla";
  if (body?.start) {
    return Response.json(await runMockScenario("missed", parentId));
  }
  const { start, end } = istDayBounds(istDayKey());
  const open = await query<{ id: string }>(
    `select id from calls where parent_id = $1 and started_at >= $2 and started_at < $3 order by started_at desc limit 1`,
    [parentId, start, end],
  );
  if (!open[0]) return Response.json({ ok: false, error: "no_call" }, { status: 404 });
  return Response.json(
    await advanceLadder({ parentId, callId: open[0].id, elapsedMin: body?.elapsed_min ?? 60, redial: false }),
  );
}
