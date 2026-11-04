import { toIsoString } from "@/lib/time";

export function deskMedsStamp(doses: { medicine_id?: string | null; status?: string | null }[]) {
  return doses
    .map((dose) => `${dose.medicine_id || ""}:${dose.status || ""}`)
    .sort()
    .join(",");
}

export function deskLiveStamp(input: {
  callId?: string | null;
  status?: string | null;
  endedAt?: unknown;
  alertId?: string | null;
  hasWords?: boolean;
  meds?: string | null;
  errands?: string | null;
}) {
  return [
    input.callId || "",
    input.status || "",
    toIsoString(input.endedAt),
    input.alertId || "",
    input.hasWords ? "1" : "0",
    input.meds || "",
    input.errands || "",
  ].join("|");
}
