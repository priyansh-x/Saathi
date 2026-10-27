import { isMockWhatsapp, isWhatsappTemplateApproved, killSwitchOn } from "@/lib/config";
import { gateOutbound } from "@/lib/outbound";
import {
  evaluateWhatsappGate,
  maskPhoneLast4,
  whatsappGraphUrl,
  type WhatsappGateBlock,
} from "@/lib/whatsapp/gate";
import { buildWhatsappPayload, sessionWindowOpen } from "@/lib/whatsapp/send";
import { renderTemplate, type TemplateName } from "@/lib/whatsapp/templates";

export type WhatsappPreviewInput = {
  toPhone: string;
  locale: "en" | "hi";
  template: Exclude<TemplateName, "hello_world">;
  vars: string[];
  storedOptIn: boolean;
  optedOut: boolean;
  lastInboundAt?: string | null;
  windowOpen?: boolean;
};

export type WhatsappPreview = {
  template: string;
  language: "en" | "hi";
  body: string;
  payload: ReturnType<typeof buildWhatsappPayload>;
  payloadJson: string;
  graphUrl: string;
  gate: string;
  blocked?: WhatsappGateBlock;
};

function redactPayload(payload: ReturnType<typeof buildWhatsappPayload>) {
  return {
    ...payload,
    to: maskPhoneLast4(payload.to),
  };
}

export function previewFamilyMessage(input: WhatsappPreviewInput): WhatsappPreview {
  const language = input.locale;
  const windowOpen = input.windowOpen ?? sessionWindowOpen(input.lastInboundAt);
  const body = renderTemplate(input.template, input.vars, language);
  const gate = gateOutbound("whatsapp", input.toPhone);
  const approved = isWhatsappTemplateApproved(input.template, language);
  const mock = isMockWhatsapp();
  const decision = evaluateWhatsappGate({
    killSwitch: killSwitchOn(),
    optedIn: input.storedOptIn,
    optedOut: input.optedOut,
    gateOk: gate.ok,
    gateReason: gate.ok ? undefined : gate.reason,
    approved,
    mock,
  });
  const payload = redactPayload(
    buildWhatsappPayload({
      to: input.toPhone,
      template: input.template,
      language,
      vars: input.vars,
      windowOpen,
    }),
  );
  const payloadJson = JSON.stringify(payload, null, 2);
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "{WHATSAPP_PHONE_NUMBER_ID}";
  let gateLabel: string;
  if (!decision.ok) {
    if (decision.blocked === "unapproved_template" || decision.blocked === "not_opted_in" || decision.blocked === "opted_out") {
      gateLabel = `would send via push/email (${decision.blocked})`;
    } else {
      gateLabel = `blocked: ${decision.blocked}`;
    }
  } else if (decision.next === "mock") {
    gateLabel = "would mock (MOCK_WHATSAPP=1); live Graph is not called";
  } else {
    gateLabel = "would send";
  }
  return {
    template: input.template,
    language,
    body,
    payload,
    payloadJson,
    graphUrl: whatsappGraphUrl(phoneId).replace(/\/\/.*@/, "//"),
    gate: gateLabel,
    blocked: decision.ok ? undefined : decision.blocked,
  };
}
