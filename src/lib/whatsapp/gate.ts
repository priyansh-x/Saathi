export type WhatsappGateBlock =
  | "kill_switch"
  | "not_opted_in"
  | "opted_out"
  | "not_allowlisted"
  | "missing_target"
  | "unapproved_template";

export type WhatsappGateDecision =
  | { ok: false; blocked: WhatsappGateBlock }
  | { ok: true; next: "mock" | "live" };

/**
 * Gating order for every family WhatsApp send:
 * kill switch → opt-in → not opted out → allowlist → approved name:lang → mock vs live.
 */
export function evaluateWhatsappGate(args: {
  killSwitch: boolean;
  optedIn: boolean;
  optedOut: boolean;
  gateOk: boolean;
  gateReason?: "kill_switch" | "not_allowlisted" | "missing_target";
  approved: boolean;
  mock: boolean;
}): WhatsappGateDecision {
  if (args.killSwitch) return { ok: false, blocked: "kill_switch" };
  if (args.optedOut) return { ok: false, blocked: "opted_out" };
  if (!args.optedIn) return { ok: false, blocked: "not_opted_in" };
  if (!args.gateOk) return { ok: false, blocked: args.gateReason ?? "not_allowlisted" };
  if (!args.approved) return { ok: false, blocked: "unapproved_template" };
  return { ok: true, next: args.mock ? "mock" : "live" };
}

export function isWhatsappOptOutText(text: string) {
  const t = text.trim().toLowerCase();
  return t === "stop" || t === "band" || t === "बंद";
}

export function metaRecipientDigits(phone: string) {
  return phone.replace(/\D/g, "");
}

export function maskPhoneLast4(phone: string) {
  const digits = metaRecipientDigits(phone);
  if (digits.length < 4) return "****";
  return `****${digits.slice(-4)}`;
}

export function whatsappGraphVersion(raw = process.env.WHATSAPP_GRAPH_VERSION) {
  const value = (raw || "v21.0").trim();
  return value || "v21.0";
}

export function whatsappGraphUrl(phoneNumberId: string, version = whatsappGraphVersion()) {
  return `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
}
