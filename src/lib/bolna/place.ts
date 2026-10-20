import { callProviderName } from "@/lib/config";
import {
  insertSimulatedCall,
  isPreparedCall,
  postBolnaCall,
  prepareMorningCall,
} from "@/lib/calls/prepare";
import { placeCall } from "@/lib/calls/provider";

export { bolnaAgentLanguage, minutesUsedToday } from "@/lib/calls/prepare";

/** Shared entry: tick, onboard, and tests. Dispatches to CALL_PROVIDER. */
export async function placeMorningCall(parentId: string, clock: Date = new Date()) {
  return placeCall(parentId, clock);
}

/** Desk Settings test ring. Skips the once-a-day cap; still gated. */
export async function placeTestCall(parentId: string, clock: Date = new Date()) {
  const prepared = await prepareMorningCall(parentId, clock, { forceTest: true });
  if (!isPreparedCall(prepared)) return prepared;
  if (callProviderName() === "bolna") return postBolnaCall(prepared);
  return insertSimulatedCall(prepared);
}
