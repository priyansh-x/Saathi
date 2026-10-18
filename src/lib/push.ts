import { isMockWhatsapp, killSwitchOn } from "@/lib/config";
import { query } from "@/lib/db/client";
import { childrenFor } from "@/lib/members";
import { gateOutbound } from "@/lib/outbound";
import { nowIstStamp } from "@/lib/time";
import { logOutbound } from "@/lib/whatsapp/send";

export async function savePushSubscription(parentId: string, endpoint: string) {
  const parent = await query<{ is_example: boolean }>(`select is_example from parents where id = $1`, [parentId]);
  if (!parent[0]) return { ok: false as const, error: "unknown_parent" };
  const trimmed = endpoint.trim();
  if (!trimmed) return { ok: false as const, error: "missing_endpoint" };
  const existing = await query<{ id: string }>(
    `select id from push_subscriptions where parent_id = $1 and endpoint = $2`,
    [parentId, trimmed],
  );
  if (existing[0]) return { ok: true as const, id: existing[0].id };
  const id = `push_${parentId}_${Math.random().toString(16).slice(2, 10)}`;
  await query(`insert into push_subscriptions values ($1,$2,$3,$4,$5)`, [
    id,
    parentId,
    trimmed,
    nowIstStamp(),
    parent[0].is_example,
  ]);
  return { ok: true as const, id };
}

export async function sendPushToFamily(parentId: string, title: string, body: string, idempotencyKey: string) {
  if (killSwitchOn()) return { ok: false as const, status: "kill_switch" as const, results: [] };
  const children = await childrenFor(parentId);
  const subs = await query<{ id: string; endpoint: string }>(
    `select id, endpoint from push_subscriptions where parent_id = $1`,
    [parentId],
  );
  const results = [];
  for (const child of children) {
    const gate = gateOutbound("push", child.phone);
    const id = `out_push_${idempotencyKey}_${child.phone.replace(/\s/g, "")}`.slice(0, 80);
    const existing = await query<{ id: string }>(`select id from outbound_messages where id = $1`, [id]);
    if (existing[0]) {
      results.push({ ok: true, id, status: "duplicate" });
      continue;
    }
    const status = !gate.ok ? `blocked_${gate.reason}` : isMockWhatsapp() ? "mock" : subs.length ? "queued" : "no_subscription";
    await logOutbound({
      id,
      parentId,
      channel: "push",
      template: "web_push",
      to: gate.ok ? gate.to : child.phone,
      body: `${title}\n${body}`,
      status,
    });
    results.push({ ok: status === "mock" || status === "queued", id, status });
  }
  return { ok: true as const, results };
}
