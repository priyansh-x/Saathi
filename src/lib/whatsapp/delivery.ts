import { query } from "@/lib/db/client";
import { childrenFor } from "@/lib/members";
import { neighbourOptedIn } from "@/lib/neighbour";
import { nowIstStamp } from "@/lib/time";
import { outboundMessageId, sendFamilyMessage } from "@/lib/whatsapp/send";
import { packTemplate, type TemplateName } from "@/lib/whatsapp/templates";

export type WaStatus = {
  id?: string;
  status?: string;
  timestamp?: string;
  recipient_id?: string;
};

const ALERT_TEMPLATES = [
  "safety_alert_emergency",
  "safety_alert_urgent",
  "safety_alert_unreachable",
  "responder_alert_emergency",
  "responder_alert_unreachable",
];

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

const DELIVERY_RANK: Record<string, number> = {
  failed: 0,
  sent: 1,
  delivered: 2,
  read: 3,
  mock: 3,
};

/** Success never moves backwards. A late sent must not overwrite delivered or read. */
export function deliveryMayAdvance(prev: string | null | undefined, next: string) {
  const to = DELIVERY_RANK[next];
  if (to === undefined) return false;
  const from = DELIVERY_RANK[prev || ""];
  if (from === undefined) return true;
  if (next === "failed") return from < DELIVERY_RANK.delivered;
  return to >= from;
}

function phoneKey(phone: string) {
  return phone.replace(/\D/g, "").slice(-10);
}

function isEscalationId(id: string) {
  return id.includes("_esc_") || id.includes("esc_out_");
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
    const current = await query<{ id: string; delivery_status: string | null }>(
      `select id, delivery_status from outbound_messages where provider_message_id = $1`,
      [wamid],
    );
    if (!current[0] || !deliveryMayAdvance(current[0].delivery_status, status)) continue;
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

/** Desk copy: "Couldn't reach Rohit" when email fallback never left. */
export async function latestUndeliveredEmail(parentId: string) {
  const rows = await query<{
    to_phone: string;
    first_name: string | null;
  }>(
    `select o.to_phone, c.first_name
     from outbound_messages o
     left join contacts c
       on c.parent_id = o.parent_id
      and lower(coalesce(c.email, '')) = lower(o.to_phone)
     where o.parent_id = $1
       and o.channel = 'email'
       and (o.status = 'undelivered' or o.delivery_status = 'undelivered')
     order by o.at desc, o.id desc
     limit 1`,
    [parentId],
  );
  const row = rows[0];
  if (!row) return null;
  const name = row.first_name || "family";
  return { name, line: `Couldn't reach ${name}` };
}

async function ladderPeople(parentId: string) {
  const kids = await childrenFor(parentId);
  const neighbour = await query<{ phone: string; locale: string; first_name: string; role: "neighbour" }>(
    `select phone, locale, first_name, role from contacts where parent_id = $1 and role = 'neighbour' limit 1`,
    [parentId],
  );
  const people = kids.map((c) => ({
    phone: c.phone,
    locale: c.locale,
    first_name: c.first_name,
    role: c.role,
  }));
  if (neighbour[0] && (await neighbourOptedIn(parentId))) people.push(neighbour[0]);
  return people;
}

async function relatedAlert(parentId: string, outboundId: string) {
  const alerts = await query<{
    id: string;
    quote: string;
    created_at: string;
    acked_at: string | null;
    resolved_at: string | null;
    call_id: string | null;
  }>(
    `select id, quote, created_at, acked_at, resolved_at, call_id from alerts where parent_id = $1 order by created_at desc`,
    [parentId],
  );
  return alerts.find((alert) => outboundId.includes(alert.id)) ?? null;
}

async function alertVars(args: {
  parentId: string;
  template: string;
  at: string;
  quote?: string | null;
  callId?: string | null;
  locale?: "en" | "hi";
}) {
  const parent = await query<{ first_name: string; address_term: string | null; phone: string }>(
    `select first_name, address_term, phone from parents where id = $1`,
    [args.parentId],
  );
  const neighbour = await query<{ first_name: string; phone: string }>(
    `select first_name, phone from contacts where parent_id = $1 and role = 'neighbour' limit 1`,
    [args.parentId],
  );
  const who = parent[0]?.address_term?.trim() || parent[0]?.first_name || "family";
  const stamp = args.at.includes("T") ? args.at : "";
  const time = stamp.slice(11, 16) || "08:33";
  const quote = args.quote?.trim() || "—";
  const phone = parent[0]?.phone || "";
  const tries = args.callId
    ? await query<{ n: number }>(`select count(*)::int as n from call_attempts where call_id = $1`, [args.callId])
    : [{ n: 1 }];
  const tryCount = String(Math.max(1, tries[0]?.n || 1));
  const locale = args.locale ?? "en";
  const responderSent = neighbour[0]
    ? await query<{ n: number }>(
        `select count(*)::int as n from outbound_messages
         where parent_id = $1 and to_phone = $2 and template like 'responder_alert%'`,
        [args.parentId, neighbour[0].phone],
      )
    : [{ n: 0 }];
  const messaged = Boolean(neighbour[0]) && (await neighbourOptedIn(args.parentId)) && (responderSent[0]?.n ?? 0) > 0;
  const neighbourVar = messaged
    ? neighbour[0]!.first_name
    : packTemplate(args.template, locale)?.examples[3] ?? "";
  if (args.template === "safety_alert_unreachable") return [who, tryCount, time, neighbourVar, phone];
  if (args.template === "safety_alert_emergency") return [who, time, quote, neighbourVar, phone];
  if (args.template === "safety_alert_urgent") return [who, time, quote, "uneasy"];
  return [who];
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
    if (isEscalationId(row.id)) continue;
    const alert = await relatedAlert(row.parent_id, row.id);
    if (alert?.acked_at || alert?.resolved_at) continue;
    const people = await ladderPeople(row.parent_id);
    const chain = await query<{ to_phone: string; id: string; delivery_status: string | null; at: string }>(
      `select to_phone, id, delivery_status, at from outbound_messages
       where parent_id = $1
         and (id = $2 or id like $3)`,
      [row.parent_id, row.id, `%esc_${row.id}%`],
    );
    if (chain.some((item) => item.delivery_status === "delivered" || item.delivery_status === "read")) {
      continue;
    }
    const lastAt = chain.reduce((latest, item) => (item.at > latest ? item.at : latest), row.at);
    if (lastAt >= cutoff) continue;
    const used = new Set(chain.map((item) => phoneKey(item.to_phone)).filter(Boolean));
    used.add(phoneKey(row.to_phone));
    const next = people.find((person) => !used.has(phoneKey(person.phone)));
    if (!next) continue;
    const hop = used.size;
    const intended = row.template.replace(/_en$|_hi$/, "") as Exclude<TemplateName, "hello_world">;
    const idempotencyKey = hop <= 1 ? `esc_${row.id}` : `esc_${row.id}${hop}`;
    const id = outboundMessageId(intended, idempotencyKey);
    const existing = await query<{ id: string }>(`select id from outbound_messages where id = $1`, [id]);
    if (existing[0]) continue;
    const sent = await sendFamilyMessage({
      parentId: row.parent_id,
      toPhone: next.phone,
      locale: next.locale === "hi" ? "hi" : "en",
      intended,
      vars: await alertVars({
        parentId: row.parent_id,
        template: intended,
        at: alert?.created_at || row.at,
        quote: alert?.quote,
        callId: alert?.call_id,
        locale: next.locale === "hi" ? "hi" : "en",
      }),
      idempotencyKey,
    });
    results.push(sent);
  }
  return results;
}
