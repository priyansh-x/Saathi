import { connection } from "next/server";
import { hydrateBolnaCall } from "@/lib/bolna/execution";
import { query } from "@/lib/db/client";
import { parentByToken } from "@/lib/db/queries";
import { deskLiveStamp } from "@/lib/desk-live";
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
  if (open && !parent.is_example) await hydrateBolnaCall(open);
  const [call] = await query<{ id: string; status: string; ended_at: string | null; has_words: boolean }>(
    `select id, status, ended_at, (transcript_json is not null and transcript_json <> '') as has_words
       from calls where parent_id = $1 order by started_at desc limit 1`,
    [parent.id],
  );
  const [alert] = await query<{ id: string }>(
    `select id from alerts where parent_id = $1 and level = 'act' and resolved_at is null order by created_at desc limit 1`,
    [parent.id],
  );
  const stamp = deskLiveStamp({
    callId: call?.id,
    status: call?.status,
    endedAt: call?.ended_at,
    alertId: alert?.id,
    hasWords: Boolean(call?.has_words),
  });
  return Response.json({
    ok: true,
    stamp,
    busy: call?.status === "in_progress",
  });
}
