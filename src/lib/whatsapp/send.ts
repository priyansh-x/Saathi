import { isMockWhatsapp, isWhatsappTemplateApproved, killSwitchOn, PRODUCT_NAME } from "@/lib/config";
import { query } from "@/lib/db/client";
import { deliverEmail, isMockEmail, selectEmailTransport } from "@/lib/email/transport";
import { gateOutbound } from "@/lib/outbound";
import { nowIst } from "@/lib/bolna/tools";
import { mockLoggedWhatsapp } from "@/lib/whatsapp/mock-log";
import { packTemplate, renderTemplate, type TemplateName } from "@/lib/whatsapp/templates";

export type SendResult = {
  ok: boolean;
  id: string;
  channel: "whatsapp" | "email";
  template: string;
  status: string;
  reason?: string;
};

export function outboundMessageId(template: string, idempotencyKey: string) {
  return `out_${template}_${idempotencyKey}`.slice(0, 80);
}

export async function logOutbound(row: {
  id: string;
  parentId: string;
  channel: "whatsapp" | "email" | "push";
  template: string;
  to: string;
  body: string;
  status: string;
  providerMessageId?: string | null;
  deliveryStatus?: string | null;
  deliveryAt?: string | null;
}) {
  await query(
    `insert into outbound_messages (
      id, parent_id, channel, template, to_phone, body, at, status, is_example,
      provider_message_id, delivery_status, delivery_at
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      row.id,
      row.parentId,
      row.channel,
      row.template,
      row.to,
      row.body,
      nowIst(),
      row.status,
      true,
      row.providerMessageId ?? null,
      row.deliveryStatus ?? null,
      row.deliveryAt ?? null,
    ],
  );
}

async function familyEmail(parentId: string) {
  const rows = await query<{ email: string | null }>(
    `select email from contacts
     where parent_id = $1 and role = 'child' and email is not null and trim(email) <> ''
     limit 1`,
    [parentId],
  );
  return rows[0]?.email?.trim().toLowerCase() || "";
}

async function sendEmailFallback(args: {
  parentId: string;
  toHint: string;
  template: TemplateName;
  body: string;
  idempotencyKey: string;
  reason: string;
}): Promise<SendResult> {
  const email = await familyEmail(args.parentId);
  const gate = gateOutbound("email", email);
  const id = outboundMessageId(`email_${args.template}`, args.idempotencyKey);
  const existing = await query<{ id: string }>(`select id from outbound_messages where id = $1`, [id]);
  if (existing[0]) {
    return { ok: true, id, channel: "email", template: args.template, status: "duplicate" };
  }
  const to = gate.ok ? gate.to : email;
  const body = `${args.body}\n\n[fallback: ${args.reason}]`;
  if (!email || !gate.ok) {
    const status = !email ? "undelivered" : "blocked";
    await logOutbound({
      id,
      parentId: args.parentId,
      channel: "email",
      template: args.template,
      to: to || args.toHint,
      body,
      status,
      deliveryStatus: status === "undelivered" ? "undelivered" : null,
    });
    return { ok: false, id, channel: "email", template: args.template, status, reason: args.reason };
  }

  if (isMockEmail()) {
    await logOutbound({
      id,
      parentId: args.parentId,
      channel: "email",
      template: args.template,
      to,
      body,
      status: "mock_email",
      deliveryStatus: "mock",
      deliveryAt: nowIst(),
    });
    return { ok: true, id, channel: "email", template: args.template, status: "mock_email", reason: args.reason };
  }

  if (selectEmailTransport() === "none") {
    await logOutbound({
      id,
      parentId: args.parentId,
      channel: "email",
      template: args.template,
      to,
      body,
      status: "undelivered",
      deliveryStatus: "undelivered",
    });
    return { ok: false, id, channel: "email", template: args.template, status: "undelivered", reason: "no_transport" };
  }

  const posted = await deliverEmail({
    to,
    subject: `${PRODUCT_NAME}: ${args.template.replace(/_/g, " ")}`,
    text: body,
  });
  const status = posted.ok ? "sent" : "undelivered";
  await logOutbound({
    id,
    parentId: args.parentId,
    channel: "email",
    template: args.template,
    to,
    body,
    status,
    providerMessageId: posted.ok ? posted.providerId ?? null : null,
    deliveryStatus: status,
    deliveryAt: posted.ok ? nowIst() : null,
  });
  return { ok: posted.ok, id, channel: "email", template: args.template, status, reason: posted.ok ? args.reason : posted.error };
}

const WINDOW_MS = 24 * 60 * 60 * 1000;

export function sessionWindowOpen(lastInboundAt: string | null | undefined, now = new Date()) {
  if (!lastInboundAt) return false;
  const then = new Date(lastInboundAt).getTime();
  if (Number.isNaN(then)) return false;
  return now.getTime() - then < WINDOW_MS;
}

export function metaTemplateName(intended: string) {
  return intended.replace(/_en$|_hi$/, "");
}

export function metaTemplateLanguage(intended: string, locale: "en" | "hi") {
  if (intended.endsWith("_hi")) return "hi";
  if (intended.endsWith("_en")) return "en";
  return locale;
}

export type WhatsappGraphPayload = {
  messaging_product: "whatsapp";
  to: string;
  type: "text" | "template";
  text?: { body: string };
  template?: {
    name: string;
    language: { code: "en" | "hi" };
    components: unknown[];
  };
};

export function buildWhatsappPayload(args: {
  to: string;
  template: string;
  language: "en" | "hi";
  vars: string[];
  freeText?: string;
  windowOpen?: boolean;
  buttonUrlVar?: string;
}): WhatsappGraphPayload {
  if (args.freeText && args.windowOpen) {
    return {
      messaging_product: "whatsapp",
      to: args.to,
      type: "text",
      text: { body: args.freeText },
    };
  }
  const name = metaTemplateName(args.template);
  const pack = packTemplate(name, args.language);
  const components: unknown[] = [];
  if (name !== "hello_world") {
    components.push({ type: "body", parameters: args.vars.map((text) => ({ type: "text", text })) });
    pack?.buttons.forEach((btn, index) => {
      if (btn.type === "QUICK_REPLY") {
        components.push({
          type: "button",
          sub_type: "quick_reply",
          index: String(index),
          parameters: [{ type: "payload", payload: btn.text }],
        });
      } else {
        components.push({
          type: "button",
          sub_type: "url",
          index: String(index),
          parameters: [{ type: "text", text: args.buttonUrlVar || btn.example }],
        });
      }
    });
  }
  return {
    messaging_product: "whatsapp",
    to: args.to,
    type: "template",
    template: {
      name,
      language: { code: args.language },
      components,
    },
  };
}

async function lastInboundForPhone(phone: string) {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (!digits) return null;
  const rows = await query<{ last_inbound_at: string | null }>(
    `select last_inbound_at from contacts
     where regexp_replace(phone, '[^0-9]', '', 'g') like $1
     order by last_inbound_at desc nulls last
     limit 1`,
    [`%${digits}`],
  );
  return rows[0]?.last_inbound_at ?? null;
}

async function postMeta(payload: ReturnType<typeof buildWhatsappPayload>) {
  if (process.env.WHATSAPP_FORCE_FAIL === "1") {
    return { ok: false as const, error: "forced_fail" };
  }
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { ok: false as const, error: "missing_meta_creds" };
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { ok: false as const, error: `meta_${res.status}` };
  let wamid: string | undefined;
  try {
    const data = (await res.json()) as { messages?: { id?: string }[] };
    wamid = data.messages?.[0]?.id;
  } catch {
    wamid = undefined;
  }
  return { ok: true as const, wamid };
}

export async function sendFamilyMessage(args: {
  parentId: string;
  toPhone: string;
  locale: "en" | "hi";
  intended: Exclude<TemplateName, "hello_world">;
  vars: string[];
  idempotencyKey: string;
  freeText?: string;
  buttonUrlVar?: string;
}): Promise<SendResult> {
  if (killSwitchOn()) {
    return { ok: false, id: "", channel: "whatsapp", template: args.intended, status: "kill_switch" };
  }
  const language = metaTemplateLanguage(args.intended, args.locale);
  const windowOpen = sessionWindowOpen(await lastInboundForPhone(args.toPhone));
  const useFreeText = Boolean(args.freeText && windowOpen);
  const approved = isWhatsappTemplateApproved(args.intended) || useFreeText;
  const template: TemplateName = args.intended;
  const body = useFreeText ? args.freeText! : renderTemplate(template, args.vars, language);
  const id = outboundMessageId(template, args.idempotencyKey);
  const existing = await query<{ id: string }>(`select id from outbound_messages where id = $1`, [id]);
  if (existing[0]) {
    return { ok: true, id, channel: "whatsapp", template, status: "duplicate" };
  }

  const gate = gateOutbound("whatsapp", args.toPhone);
  if (!gate.ok) {
    await logOutbound({
      id,
      parentId: args.parentId,
      channel: "whatsapp",
      template,
      to: args.toPhone,
      body,
      status: `blocked_${gate.reason}`,
    });
    return sendEmailFallback({
      parentId: args.parentId,
      toHint: args.toPhone,
      template: args.intended,
      body,
      idempotencyKey: args.idempotencyKey,
      reason: gate.reason,
    });
  }

  if (!isMockWhatsapp() && !approved) {
    console.info("whatsapp_unapproved_template", { template: metaTemplateName(args.intended), language });
    return sendEmailFallback({
      parentId: args.parentId,
      toHint: gate.to,
      template: args.intended,
      body,
      idempotencyKey: args.idempotencyKey,
      reason: "unapproved_template",
    });
  }

  if (isMockWhatsapp()) {
    const graph = buildWhatsappPayload({
      to: gate.to,
      template,
      language,
      vars: args.vars,
      freeText: args.freeText,
      windowOpen,
      buttonUrlVar: args.buttonUrlVar,
    });
    const components = (graph.template?.components as { type: string }[] | undefined) ?? [];
    mockLoggedWhatsapp.push({
      name: graph.template?.name ?? template,
      language,
      vars: args.vars,
      buttons: components.filter((c) => c.type === "button").length,
    });
    await logOutbound({
      id,
      parentId: args.parentId,
      channel: "whatsapp",
      template,
      to: gate.to,
      body,
      status: useFreeText ? "mock_session" : "mock",
      providerMessageId: `wamid.mock.${id}`,
      deliveryStatus: "mock",
      deliveryAt: nowIst(),
    });
    return { ok: true, id, channel: "whatsapp", template, status: useFreeText ? "mock_session" : "mock" };
  }

  const payload = buildWhatsappPayload({
    to: gate.to,
    template,
    language,
    vars: args.vars,
    freeText: args.freeText,
    windowOpen,
    buttonUrlVar: args.buttonUrlVar,
  });
  const posted = await postMeta(payload);
  if (!posted.ok) {
    await logOutbound({
      id,
      parentId: args.parentId,
      channel: "whatsapp",
      template,
      to: gate.to,
      body,
      status: `failed_${posted.error}`,
    });
    return sendEmailFallback({
      parentId: args.parentId,
      toHint: gate.to,
      template: args.intended,
      body,
      idempotencyKey: args.idempotencyKey,
      reason: posted.error,
    });
  }

  await logOutbound({
    id,
    parentId: args.parentId,
    channel: "whatsapp",
    template,
    to: gate.to,
    body,
    status: "sent",
    providerMessageId: posted.wamid ?? null,
    deliveryStatus: "sent",
    deliveryAt: nowIst(),
  });
  return { ok: true, id, channel: "whatsapp", template, status: "sent" };
}

export async function recentOutbound(parentId: string, limit = 8) {
  return query<{
    id: string;
    channel: string;
    template: string;
    to_phone: string;
    body: string;
    at: string;
    status: string;
  }>(
    `select id, channel, template, to_phone, body, at, status
     from outbound_messages where parent_id = $1
     order by at desc, id desc limit $2`,
    [parentId, limit],
  );
}
