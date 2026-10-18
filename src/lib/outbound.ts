import { allowedEmails, allowedPhones, isMockBolna, isMockWhatsapp, killSwitchOn } from "@/lib/config";

export type OutboundKind = "call" | "whatsapp" | "email" | "push";

export type OutboundDecision =
  | { ok: true; to: string }
  | { ok: false; reason: "kill_switch" | "not_allowlisted" | "missing_target" };

export function normalizePhone(raw: string) {
  return raw.replace(/[^\d+]/g, "");
}

/** One outbound gate. Real sends never leave this function without an allowlist hit. */
export function gateOutbound(kind: OutboundKind, target: string): OutboundDecision {
  if (killSwitchOn()) return { ok: false, reason: "kill_switch" };
  const trimmed = target.trim();
  if (!trimmed) return { ok: false, reason: "missing_target" };
  if (kind === "email") {
    const email = trimmed.toLowerCase();
    if (allowedEmails().includes(email)) return { ok: true, to: email };
    return { ok: false, reason: "not_allowlisted" };
  }
  const phone = normalizePhone(trimmed);
  const allowed = allowedPhones().map(normalizePhone);
  if (allowed.includes(phone)) return { ok: true, to: phone };
  if (isMockBolna() && kind === "call") return { ok: true, to: phone };
  if (isMockWhatsapp() && (kind === "whatsapp" || kind === "push")) return { ok: true, to: phone };
  return { ok: false, reason: "not_allowlisted" };
}
