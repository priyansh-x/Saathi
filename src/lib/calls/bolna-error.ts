/** Map Bolna POST /call error bodies to a desk reason. */

export function bolnaErrorText(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const rec = body as { message?: unknown; detail?: unknown; error?: unknown };
  return [rec.message, rec.detail, rec.error]
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    .join(" ");
}

export function bolnaPlaceReason(status: number, body: unknown): string {
  const text = bolnaErrorText(body).toLowerCase();
  if (text.includes("verified phone") || text.includes("verified number")) return "bolna_unverified";
  if (text.includes("guardrail") || text.includes("calling hours") || text.includes("outside calling")) {
    return "bolna_hours";
  }
  if (status === 401 || status === 403) return "bolna_auth";
  if (status === 402 || text.includes("balance") || text.includes("wallet") || text.includes("credit")) {
    return "bolna_balance";
  }
  return "bolna_error";
}
