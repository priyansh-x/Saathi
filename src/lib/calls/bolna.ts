import { processBolnaWebhook, type BolnaWebhook } from "@/lib/bolna/webhook";
import { isPreparedCall, postBolnaCall, prepareMorningCall, type PlaceCallResult } from "@/lib/calls/prepare";
import type { CallProvider } from "@/lib/calls/provider";

/** Live Bolna POST /call. Unchanged from the previous placeMorningCall branch. */
export const bolnaProvider: CallProvider = {
  name: "bolna",
  async placeCall(parentId, clock = new Date()): Promise<PlaceCallResult> {
    const prepared = await prepareMorningCall(parentId, clock);
    if (!isPreparedCall(prepared)) return prepared;
    return postBolnaCall(prepared);
  },
  parseWebhook(payload: BolnaWebhook, executionId: string) {
    return processBolnaWebhook(payload, executionId);
  },
};
