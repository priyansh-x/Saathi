import type { PlaceCallOk } from "@/lib/calls/prepare";
import { query } from "@/lib/db/client";

/** Skip a second Settings test ring to the same parent inside this window. */
export const TEST_CALL_REUSE_MS = 60_000;

/** Return the latest call for this parent if it was placed in the last 60 seconds. */
export async function reuseRecentPlacedCall(
  parentId: string,
  clock: Date = new Date(),
): Promise<PlaceCallOk | null> {
  const rows = await query<{ id: string; bolna_execution_id: string | null; started_at: string }>(
    `select id, bolna_execution_id, started_at from calls
     where parent_id = $1
     order by started_at desc, id desc
     limit 1`,
    [parentId],
  );
  const row = rows[0];
  if (!row) return null;
  const started = Date.parse(row.started_at);
  if (!Number.isFinite(started) || clock.getTime() - started >= TEST_CALL_REUSE_MS) return null;
  const execution_id = row.bolna_execution_id || row.id;
  const mock = execution_id.startsWith("mock_") || row.id.startsWith("mock_");
  return { ok: true, execution_id, mock };
}
