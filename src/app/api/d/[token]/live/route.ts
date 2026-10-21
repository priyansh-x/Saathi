import { connection } from "next/server";
import { syncDeskFromBolna } from "@/lib/bolna/execution";
import { query } from "@/lib/db/client";
import { parentByToken } from "@/lib/db/queries";
import { deskLiveStamp, deskMedsStamp } from "@/lib/desk-live";
import { istDayKey } from "@/lib/time";
import type { CallRow } from "@/lib/db/types";

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await ctx.params;
  const parent = await parentByToken(token);
  if (!parent) return Response.json({ ok: false, error: "expired" }, { status: 404 });
  const [open] = await query<CallRow>(
    `select * from calls where parent_id = $1 order by started_at desc limit 1`,
    [parent.id],
  );
  await syncDeskFromBolna(parent, open);
  const [call] = await query<{ id: string; status: string; ended_at: string | null; has_words: boolean }>(
    `select id, status, ended_at,
            (transcript_json is not null and transcript_json <> '' and transcript_json <> '[]') as has_words
       from calls where parent_id = $1 order by started_at desc limit 1`,
    [parent.id],
  );
  const [alert] = await query<{ id: string }>(
    `select id from alerts
      where parent_id = $1 and level = 'act' and resolved_at is null
        and (call_id is null or call_id = $2 or $2 is null)
      order by created_at desc limit 1`,
    [parent.id, call?.id ?? null],
  );
  const doses = await query<{ medicine_id: string; status: string }>(
    `select distinct on (m.id) m.id as medicine_id, coalesce(d.status, 'not_asked') as status
       from medicines m
       left join dose_logs d on d.medicine_id = m.id and d.schedule_date = $2
       left join calls cl on cl.id = d.call_id
      where m.parent_id = $1
      order by m.id, coalesce(cl.started_at, '') desc, d.id desc`,
    [parent.id, istDayKey()],
  );
  const stamp = deskLiveStamp({
    callId: call?.id,
    status: call?.status,
    endedAt: call?.ended_at,
    alertId: alert?.id,
    hasWords: Boolean(call?.has_words),
    meds: deskMedsStamp(doses),
  });
  return Response.json({
    ok: true,
    stamp,
    busy: call?.status === "in_progress",
  });
}
