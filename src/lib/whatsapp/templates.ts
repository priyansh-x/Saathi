import { bodyVariables, whatsappTemplatePack, type WhatsappTemplate } from "./template-pack";

/** Names as submitted in scripts/whatsapp/templates.json. Language is separate. */
export type TemplateName =
  | "hello_world"
  | "daily_briefing_good"
  | "daily_briefing_missed_med"
  | "daily_briefing_low_mood"
  | "missed_call_soft"
  | "safety_alert_unreachable"
  | "safety_alert_unreachable_solo"
  | "safety_alert_emergency"
  | "safety_alert_emergency_solo"
  | "safety_alert_urgent"
  | "safety_alert_urgent_solo"
  | "alert_ack_update"
  | "responder_optin"
  | "responder_alert_emergency"
  | "responder_alert_unreachable"
  | "weekly_summary"
  | "onboarding_reminder"
  | "consent_declined"
  | "consent_later"
  | "parent_relay";

export function packTemplate(name: string, language: "en" | "hi"): WhatsappTemplate | undefined {
  return whatsappTemplatePack().find((tpl) => tpl.name === name && tpl.language === language);
}

export function renderTemplate(name: TemplateName, vars: string[], language: "en" | "hi" = "en") {
  if (name === "hello_world") return "Hello World";
  const tpl = packTemplate(name, language);
  if (!tpl) return vars.join(" · ");
  let body = tpl.body;
  vars.forEach((value, i) => {
    body = body.replaceAll(`{{${i + 1}}}`, value);
  });
  return body;
}

export function packBodyVarCount(name: string, language: "en" | "hi") {
  const tpl = packTemplate(name, language);
  if (!tpl) return 0;
  return bodyVariables(tpl.body).length;
}
