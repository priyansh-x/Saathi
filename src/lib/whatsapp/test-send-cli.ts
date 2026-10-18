import { isMockWhatsapp, isWhatsappTemplateApproved } from "@/lib/config";
import { gateOutbound, normalizePhone } from "@/lib/outbound";
import { buildWhatsappPayload, metaTemplateLanguage, type WhatsappGraphPayload } from "@/lib/whatsapp/send";
import type { TemplateName } from "@/lib/whatsapp/templates";

const ALIASES: Record<string, Exclude<TemplateName, "hello_world"> | "hello_world"> = {
  briefing: "daily_briefing_en",
  daily_briefing: "daily_briefing_en",
  daily_briefing_en: "daily_briefing_en",
  daily_briefing_hi: "daily_briefing_hi",
  safety: "safety_alert_en",
  safety_alert: "safety_alert_en",
  safety_alert_en: "safety_alert_en",
  safety_alert_hi: "safety_alert_hi",
  hello_world: "hello_world",
};

/** EXAMPLE values only — labelled for Meta's template preview, never a real family. */
const EXAMPLE_VARS: Record<string, string[]> = {
  daily_briefing_en: ["Maa", "8:04", "Good", "both taken", "EXAMPLE quote", "https://saathi.example/d/example-kamla"],
  daily_briefing_hi: ["माँ", "8:04", "ठीक", "दोनों लीं", "EXAMPLE quote", "https://saathi.example/d/example-kamla"],
  safety_alert_en: ["Maa", "EXAMPLE chest pain", "8:42", "Rohit", "Sunita", "https://saathi.example/d/example-kamla"],
  safety_alert_hi: ["माँ", "EXAMPLE", "8:42", "Rohit", "Sunita", "https://saathi.example/d/example-kamla"],
  hello_world: [],
};

export function parseTestSendArgs(argv: string[]) {
  const yes = argv.includes("--yes");
  const rest = argv.filter((arg) => arg !== "--yes" && arg !== "--");
  const phone = rest.find((arg) => /^\+?\d[\d\s-]*$/.test(arg)) ?? "";
  const templateArg = rest.find((arg) => arg !== phone && !arg.endsWith(".ts") && !arg.endsWith("tsx")) ?? "";
  return { yes, phone: phone ? normalizePhone(phone) : "", templateArg };
}

export function resolveTestSendTemplate(templateArg: string) {
  const key = templateArg.trim().toLowerCase().replace(/-/g, "_");
  return ALIASES[key] ?? "";
}

export function exampleVarsFor(template: string) {
  return EXAMPLE_VARS[template] ?? ["EXAMPLE"];
}

export function plannedTestSend(phone: string, templateArg: string) {
  const template = resolveTestSendTemplate(templateArg);
  const language = template ? metaTemplateLanguage(template, "en") : "en";
  const vars = template ? exampleVarsFor(template) : ["EXAMPLE"];
  const gate = phone ? gateOutbound("whatsapp", phone) : { ok: false as const, reason: "missing_target" as const };
  const payload: WhatsappGraphPayload | null = template
    ? buildWhatsappPayload({
        to: gate.ok ? gate.to : phone || "+91",
        template,
        language,
        vars,
      })
    : null;
  return {
    url: "https://graph.facebook.com/v21.0/{phone-number-id}/messages",
    template,
    language,
    vars,
    example: true as const,
    payload,
    allowlisted: gate.ok,
    approved: template ? isWhatsappTemplateApproved(template) : false,
  };
}

export function canSendTestWhatsapp(phone: string, templateArg: string, yes: boolean) {
  if (!yes) return { ok: false as const, reason: "missing_yes" };
  if (isMockWhatsapp()) return { ok: false as const, reason: "mock_on" };
  if (!phone) return { ok: false as const, reason: "missing_phone" };
  const template = resolveTestSendTemplate(templateArg);
  if (!template) return { ok: false as const, reason: "unknown_template" };
  if (template === "hello_world") return { ok: false as const, reason: "hello_world_not_used" };
  if (!isWhatsappTemplateApproved(template)) return { ok: false as const, reason: "unapproved_template" };
  const gate = gateOutbound("whatsapp", phone);
  if (!gate.ok) return { ok: false as const, reason: gate.reason };
  return { ok: true as const, to: gate.to, template: template as Exclude<TemplateName, "hello_world"> };
}
