import { placeCall } from "@/lib/calls/provider";

export { bolnaAgentLanguage, minutesUsedToday } from "@/lib/calls/prepare";

/** Shared entry: tick, onboard, and tests. Dispatches to CALL_PROVIDER. */
export async function placeMorningCall(parentId: string, clock: Date = new Date()) {
  return placeCall(parentId, clock);
}
