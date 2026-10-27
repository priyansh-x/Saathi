import { isMockWhatsapp, isWhatsappTemplateApproved } from "@/lib/config";
import { gateOutbound, normalizePhone } from "@/lib/outbound";
import { whatsappGraphUrl } from "@/lib/whatsapp/gate";
import { buildWhatsappPayload, metaTemplateLanguage, type WhatsappGraphPayload } from "@/lib/whatsapp/send";
import { packTemplate, type TemplateName } from "@/lib/whatsapp/templates";

const ALIASES: Record<string, Exclude<TemplateName, "hello_world"> | "hello_world"> = {
  briefing: "daily_briefing_good",
  daily_briefing: "daily_briefing_good",
  daily_briefing_en: "daily_briefing_good",
  daily_briefing_hi: "daily_briefing_good",
  daily_briefing_good: "daily_briefing_good",
  safety: "safety_alert_emergency",
  safety_alert: "safety_alert_emergency",
  safety_alert_en: "safety_alert_emergency",
  safety_alert_hi: "safety_alert_emergency",
  safety_alert_emergency_solo: "safety_alert_emergency_solo",
  safety_alert_unreachable_solo: "safety_alert_unreachable_solo",
  safety_alert_urgent_solo: "safety_alert_urgent_solo",
  hello_world: "hello_world",
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

export function exampleVarsFor(template: string, language: "en" | "hi" = "en") {
  if (template === "hello_world") return [];
  return packTemplate(template, language)?.examples ?? ["EXAMPLE"];
}

export function plannedTestSend(phone: string, templateArg: string) {
  const template = resolveTestSendTemplate(templateArg);
  const language = template ? metaTemplateLanguage(template, "en") : "en";
  const vars = template ? exampleVarsFor(template, language) : ["EXAMPLE"];
  const gate = phone ? gateOutbound("whatsapp", phone) : { ok: false as const, reason: "missing_target" as const };
  const payload: WhatsappGraphPayload | null = template
    ? buildWhatsappPayload({
        to: gate.ok ? gate.to : phone || "+91",
        template,
        language,
        vars,
        buttonUrlVar: "example-kamla",
      })
    : null;
  return {
    url: whatsappGraphUrl("{phone-number-id}"),
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

/** Allowlist is enough. The number does not have to already be a contact. */
export async function resolveTestSendParentId(phone: string) {
  const digits = phone.replace(/\D/g, "").slice(-10);
  const { query } = await import("@/lib/db/client");
  const contacts = await query<{ parent_id: string }>(
    `select parent_id from contacts where regexp_replace(phone, '[^0-9]', '', 'g') like $1 limit 1`,
    [`%${digits}`],
  );
  if (contacts[0]?.parent_id) return contacts[0].parent_id;
  const example = await query<{ id: string }>(
    `select id from parents where is_example = true order by id limit 1`,
  );
  return example[0]?.id ?? "parent_kamla";
}
