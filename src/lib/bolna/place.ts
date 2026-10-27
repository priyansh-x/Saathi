import { finishSimulatedDeskCall } from "@/lib/bolna/example-desk";
import { callProviderName } from "@/lib/config";
import {
  insertSimulatedCall,
  isPreparedCall,
  logTestRing,
  postBolnaCall,
  prepareMorningCall,
} from "@/lib/calls/prepare";
import { placeCall } from "@/lib/calls/provider";
import { query } from "@/lib/db/client";

export { bolnaAgentLanguage, minutesUsedToday } from "@/lib/calls/prepare";

async function finishIfSimulatedExample(
  parentId: string,
  placed: { ok: true; mock?: boolean; execution_id?: string },
) {
  if (!placed.mock || !placed.execution_id) return placed;
  const parent = await query<{ is_example: boolean }>(`select is_example from parents where id = $1`, [parentId]);
  if (!parent[0]?.is_example) return placed;
  await finishSimulatedDeskCall(parentId, placed.execution_id);
  return placed;
}

/** Shared entry: tick, onboard, and tests. Dispatches to CALL_PROVIDER. */
export async function placeMorningCall(parentId: string, clock: Date = new Date()) {
  const placed = await placeCall(parentId, clock);
  if (placed.ok) return finishIfSimulatedExample(parentId, placed);
  return placed;
}

/** Desk Settings test ring. Skips the once-a-day cap; still gated. */
export async function placeTestCall(parentId: string, clock: Date = new Date()) {
  const prepared = await prepareMorningCall(parentId, clock, { forceTest: true });
  if (!isPreparedCall(prepared)) return prepared;
  if (callProviderName() === "bolna") {
    const placed = await postBolnaCall(prepared);
    if (placed.ok) await logTestRing(prepared.parentId, prepared.payload.recipient_phone_number, clock);
    return placed;
  }
  const placed = await insertSimulatedCall(prepared);
  await logTestRing(prepared.parentId, prepared.payload.recipient_phone_number, clock);
  await finishSimulatedDeskCall(prepared.parentId, placed.execution_id);
  return placed;
}
