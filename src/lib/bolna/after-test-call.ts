import type { PlaceCallResult } from "@/lib/calls/prepare";

/** Settings / Call now: open the live call so transcript, meds, and alerts appear as they land. */
export function deskCallHref(
  token: string,
  lang: string,
  placed: PlaceCallResult | { ok: true; execution_id?: string },
  from: "settings" | "today" = "settings",
) {
  if (!placed.ok) {
    const reason = "reason" in placed ? placed.reason : "fail";
    const wait = "retryInMin" in placed && typeof placed.retryInMin === "number" ? placed.retryInMin : 0;
    const code = reason === "ring_rate_limit" && wait > 0 ? `wait_${wait}` : reason;
    const base = from === "today" ? `/d/${token}` : `/d/${token}/settings`;
    return `${base}?lang=${lang}&call=${encodeURIComponent(code)}`;
  }
  const id = placed.execution_id;
  if (!id) {
    const base = from === "today" ? `/d/${token}` : `/d/${token}/settings`;
    return `${base}?lang=${lang}&call=placed`;
  }
  return `/d/${token}/calls/${encodeURIComponent(id)}?lang=${lang}&from=${from === "today" ? "today" : "history"}&call=placed`;
}
