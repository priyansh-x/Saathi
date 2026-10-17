import { isMockWhatsapp, killSwitchOn, templatesApproved } from "@/lib/config";
import { query } from "@/lib/db/client";
import { gateOutbound } from "@/lib/outbound";
import { nowIst } from "@/lib/bolna/tools";
import { renderTemplate, type TemplateName } from "@/lib/whatsapp/templates";

export type SendResult = {
  ok: boolean;
  id: string;
  channel: "whatsapp" | "email";
  template: string;
  status: string;
  reason?: string;
};

function messageId(template: string, idempotencyKey: string) {
  return `out_${template}_${idempotencyKey}`.slice(0, 80);
}

export async function logOutbound(row: {
  id: string;
  parentId: string;
  channel: "whatsapp" | "email";
  template: string;
  to: string;
  body: string;
  status: string;
}) {
  await query(`insert into outbound_messages values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [
    row.id,
    row.parentId,
    row.channel,
    row.template,
    row.to,
    row.body,
    nowIst(),
    row.status,
    true,
  ]);
}

async function sendEmailFallback(args: {
  parentId: string;
  toHint: string;
  template: TemplateName;
  body: string;
  idempotencyKey: string;
  reason: string;
}): Promise<SendResult> {
  const email = (process.env.ALLOWED_EMAILS || "").split(",")[0]?.trim() || "dev@local";
  const gate = gateOutbound("email", email);
  const id = messageId(`email_${args.template}`, args.idempotencyKey);
  const existing = await query<{ id: string }>(`select id from outbound_messages where id = $1`, [id]);
  if (existing[0]) {
    return { ok: true, id, channel: "email", template: args.template, status: "duplicate" };
  }
  const status = gate.ok || isMockWhatsapp() ? (isMockWhatsapp() ? "mock_email" : "sent") : "blocked";
  await logOutbound({
    id,
    parentId: args.parentId,
    channel: "email",
    template: args.template,
    to: gate.ok ? gate.to : email,
    body: `${args.body}\n\n[fallback: ${args.reason}]`,
    status,
  });
  return { ok: status !== "blocked", id, channel: "email", template: args.template, status, reason: args.reason };
}

async function postMeta(to: string, template: TemplateName, vars: string[]) {
  if (process.env.WHATSAPP_FORCE_FAIL === "1") {
    return { ok: false as const, error: "forced_fail" };
  }
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { ok: false as const, error: "missing_meta_creds" };
  const components =
    template === "hello_world"
      ? []
      : [{ type: "body", parameters: vars.map((text) => ({ type: "text", text })) }];
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: { name: template, language: { code: template.endsWith("_hi") ? "hi" : "en" }, components },
    }),
  });
  if (!res.ok) return { ok: false as const, error: `meta_${res.status}` };
  return { ok: true as const };
}

export async function sendFamilyMessage(args: {
  parentId: string;
  toPhone: string;
  locale: "en" | "hi";
  intended: Exclude<TemplateName, "hello_world">;
  vars: string[];
  idempotencyKey: string;
}): Promise<SendResult> {
  if (killSwitchOn()) {
    return { ok: false, id: "", channel: "whatsapp", template: args.intended, status: "kill_switch" };
  }
  const template: TemplateName = templatesApproved() ? args.intended : "hello_world";
  const body = renderTemplate(template, args.vars);
  const id = messageId(template, args.idempotencyKey);
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

  if (isMockWhatsapp()) {
    await logOutbound({
      id,
      parentId: args.parentId,
      channel: "whatsapp",
      template,
      to: gate.to,
      body,
      status: "mock",
    });
    return { ok: true, id, channel: "whatsapp", template, status: "mock" };
  }

  const posted = await postMeta(gate.to, template, args.vars);
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
