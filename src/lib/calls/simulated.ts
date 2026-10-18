import { processBolnaWebhook, type BolnaWebhook } from "@/lib/bolna/webhook";
import { insertSimulatedCall, isPreparedCall, prepareMorningCall, type PlaceCallResult } from "@/lib/calls/prepare";
import type { CallProvider } from "@/lib/calls/provider";

export const simulatedProvider: CallProvider = {
  name: "simulated",
  async placeCall(parentId, clock = new Date()): Promise<PlaceCallResult> {
    const prepared = await prepareMorningCall(parentId, clock);
    if (!isPreparedCall(prepared)) return prepared;
    return insertSimulatedCall(prepared);
  },
  parseWebhook(payload: BolnaWebhook, executionId: string) {
    return processBolnaWebhook(payload, executionId);
  },
};
