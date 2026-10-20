import { toIsoString } from "@/lib/time";

export function deskLiveStamp(input: {
  callId?: string | null;
  status?: string | null;
  endedAt?: unknown;
  alertId?: string | null;
  hasWords?: boolean;
}) {
  return [
    input.callId || "",
    input.status || "",
    toIsoString(input.endedAt),
    input.alertId || "",
    input.hasWords ? "1" : "0",
  ].join("|");
}
