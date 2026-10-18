import type { BolnaWebhook } from "@/lib/bolna/webhook";
import { bolnaProvider } from "@/lib/calls/bolna";
import type { PlaceCallResult } from "@/lib/calls/prepare";
import { simulatedProvider } from "@/lib/calls/simulated";
import { callProviderName } from "@/lib/config";

export type CallProviderName = "simulated" | "bolna";

export type CallProvider = {
  name: CallProviderName;
  placeCall: (parentId: string, clock?: Date) => Promise<PlaceCallResult>;
  parseWebhook: (payload: BolnaWebhook, executionId: string) => ReturnType<
    typeof import("@/lib/bolna/webhook").processBolnaWebhook
  >;
};

export function getCallProvider(): CallProvider {
  return callProviderName() === "bolna" ? bolnaProvider : simulatedProvider;
}

export async function placeCall(parentId: string, clock?: Date): Promise<PlaceCallResult> {
  return getCallProvider().placeCall(parentId, clock);
}

export async function parseWebhook(payload: BolnaWebhook, executionId: string) {
  return getCallProvider().parseWebhook(payload, executionId);
}
