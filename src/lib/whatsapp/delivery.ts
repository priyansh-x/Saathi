import { query } from "@/lib/db/client";
import { nowIstStamp } from "@/lib/time";
import { outboundMessageId, sendFamilyMessage } from "@/lib/whatsapp/send";
import type { TemplateName } from "@/lib/whatsapp/templates";

export type WaStatus = {
  id?: string;
  status?: string;
  timestamp?: string;
  recipient_id?: string;
};

const ALERT_TEMPLATES = ["safety_alert_en", "safety_alert_hi", "responder_en", "responder_hi"];

export function parseWhatsappStatuses(raw: string): WaStatus[] {
  try {
    const body = JSON.parse(raw || "{}") as {
      entry?: { changes?: { value?: { statuses?: WaStatus[] } }[] }[];
    };
    return body.entry?.flatMap((e) => e.changes?.flatMap((c) => c.value?.statuses ?? []) ?? []) ?? [];
  } catch {
    return [];
  }
}

export function normalizeDeliveryStatus(status?: string) {
  const raw = (status || "").toLowerCase();
  if (raw === "sent" || raw === "delivered" || raw === "read" || raw === "failed") return raw;
  return "";
}

function statusAt(row: WaStatus, fallback: string) {
  if (!row.timestamp) return fallback;
  const sec = Number(row.timestamp);
  if (!Number.isFinite(sec)) return fallback;
  return nowIstStamp(new Date(sec * 1000));
}

export async function recordWhatsappWebhook(raw: string, kind: "inbound" | "status" | "empty") {
  const at = nowIstStamp();
  const id = `wh_wa_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  await query(`insert into webhook_events values ($1,$2,$3,$4,$5,$6)`, [
    id,
    "whatsapp",
    kind,
    raw,
    at,
    true,
  ]);
}

export async function applyWhatsappStatuses(statuses: WaStatus[], at = nowIstStamp()) {
  const applied: string[] = [];
  for (const row of statuses) {
    const status = normalizeDeliveryStatus(row.status);
    const wamid = row.id;
    if (!status || !wamid) continue;
    const updated = await query<{ id: string }>(
      `update outbound_messages
       set delivery_status = $2, delivery_at = $3
       where provider_message_id = $1
       returning id`,
      [wamid, status, statusAt(row, at)],
    );
    if (updated[0]) applied.push(updated[0].id);
  }
  return applied;
}

/** Desk copy: "Delivered to Rohit 8:42" */
export function formatDeliveryClock(stamp: string) {
  const match = stamp.match(/T(\d{2}):(\d{2})/);
  if (!match) return stamp;
  return `${Number(match[1])}:${match[2]}`;
}

export function formatDeliveryLine(name: string, clock: string) {
  return `Delivered to ${name} ${clock}`;
}

export async function latestDelivery(parentId: string) {
  const rows = await query<{
    to_phone: string;
    delivery_status: string | null;
    delivery_at: string | null;
    at: string;
    first_name: string | null;
  }>(
    `select o.to_phone, o.delivery_status, o.delivery_at, o.at, c.first_name
     from outbound_messages o
     left join contacts c
       on c.parent_id = o.parent_id
      and regexp_replace(c.phone, '[^0-9]', '', 'g') like '%' || right(regexp_replace(o.to_phone, '[^0-9]', '', 'g'), 10)
     where o.parent_id = $1
       and o.channel = 'whatsapp'
       and o.delivery_status in ('delivered', 'read', 'mock')
     order by coalesce(o.delivery_at, o.at) desc, o.id desc
     limit 1`,
    [parentId],
  );
  const row = rows[0];
  if (!row) return null;
  const name = row.first_name || "family";
  const clock = formatDeliveryClock(row.delivery_at || row.at);
  return { name, clock, line: formatDeliveryLine(name, clock) };
}

export async function latestDeliveryLine(parentId: string) {
  const row = await latestDelivery(parentId);
  return row?.line ?? null;
}

export async function escalateUndeliveredAlerts(now = new Date()) {
  const cutoff = nowIstStamp(new Date(now.getTime() - 5 * 60 * 1000));
  const pending = await query<{
    id: string;
    parent_id: string;
    template: string;
    to_phone: string;
    body: string;
    at: string;
  }>(
    `select id, parent_id, template, to_phone, body, at from outbound_messages
     where channel = 'whatsapp'
       and template = any($1)
       and coalesce(delivery_status, '') not in ('delivered', 'read', 'mock')
       and at < $2`,
    [ALERT_TEMPLATES, cutoff],
  );
  const results = [];
  for (const row of pending) {
    const contacts = await query<{ phone: string; locale: string; role: string; is_owner: boolean }>(
      `select phone, locale, role, coalesce(is_owner, false) as is_owner from contacts
       where parent_id = $1
       order by case when role = 'child' then 0 else 1 end, is_owner desc`,
      [row.parent_id],
    );
    const used = row.to_phone.replace(/\D/g, "").slice(-10);
    const next = contacts.find((c) => c.phone.replace(/\D/g, "").slice(-10) !== used);
    if (!next) continue;
    const locale = next.locale === "hi" ? "hi" : "en";
    const base = row.template.replace(/_en$|_hi$/, "");
    const intended = `${base}_${locale}` as Exclude<TemplateName, "hello_world">;
    const idempotencyKey = `esc_${row.id}`;
    const id = outboundMessageId(intended, idempotencyKey);
    const existing = await query<{ id: string }>(`select id from outbound_messages where id = $1`, [id]);
    if (existing[0]) continue;
    const sent = await sendFamilyMessage({
      parentId: row.parent_id,
      toPhone: next.phone,
      locale,
      intended,
      vars: ["Maa"],
      idempotencyKey,
    });
    results.push(sent);
  }
  return results;
}
