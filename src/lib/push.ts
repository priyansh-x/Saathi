import webpush from "web-push";
import { isMockWhatsapp, killSwitchOn, publicBaseUrl } from "@/lib/config";
import { query } from "@/lib/db/client";
import { childrenFor } from "@/lib/members";
import { gateOutbound } from "@/lib/outbound";
import { nowIstStamp } from "@/lib/time";
import { logOutbound } from "@/lib/whatsapp/send";

type PushKeys = { p256dh?: string; auth?: string };

async function vapidPair() {
  const fromEnvPublic = (process.env.VAPID_PUBLIC_KEY || "").trim();
  const fromEnvPrivate = (process.env.VAPID_PRIVATE_KEY || "").trim();
  if (fromEnvPublic && fromEnvPrivate) return { publicKey: fromEnvPublic, privateKey: fromEnvPrivate };
  const rows = await query<{ key: string; value: string }>(
    `select key, value from ops_flags where key in ('vapid_public', 'vapid_private')`,
  );
  const publicKey = rows.find((row) => row.key === "vapid_public")?.value;
  const privateKey = rows.find((row) => row.key === "vapid_private")?.value;
  if (publicKey && privateKey) return { publicKey, privateKey };
  const generated = webpush.generateVAPIDKeys();
  const at = nowIstStamp();
  await query(`insert into ops_flags values ('vapid_public', $1, $2, 'system') on conflict (key) do nothing`, [
    generated.publicKey,
    at,
  ]);
  await query(`insert into ops_flags values ('vapid_private', $1, $2, 'system') on conflict (key) do nothing`, [
    generated.privateKey,
    at,
  ]);
  const stored = await query<{ key: string; value: string }>(
    `select key, value from ops_flags where key in ('vapid_public', 'vapid_private')`,
  );
  return {
    publicKey: stored.find((row) => row.key === "vapid_public")?.value || generated.publicKey,
    privateKey: stored.find((row) => row.key === "vapid_private")?.value || generated.privateKey,
  };
}

export async function vapidPublicKey() {
  return (await vapidPair()).publicKey;
}

export async function savePushSubscription(parentId: string, endpoint: string, keys?: PushKeys | null) {
  const parent = await query<{ is_example: boolean }>(`select is_example from parents where id = $1`, [parentId]);
  if (!parent[0]) return { ok: false as const, error: "unknown_parent" };
  const trimmed = endpoint.trim();
  if (!trimmed) return { ok: false as const, error: "missing_endpoint" };
  const keysJson = keys?.p256dh && keys?.auth ? JSON.stringify({ p256dh: keys.p256dh, auth: keys.auth }) : null;
  const existing = await query<{ id: string }>(
    `select id from push_subscriptions where parent_id = $1 and endpoint = $2`,
    [parentId, trimmed],
  );
  if (existing[0]) {
    if (keysJson) {
      await query(`update push_subscriptions set keys_json = $2 where id = $1`, [existing[0].id, keysJson]);
    }
    return { ok: true as const, id: existing[0].id };
  }
  const id = `push_${parentId}_${Math.random().toString(16).slice(2, 10)}`;
  await query(
    `insert into push_subscriptions (id, parent_id, endpoint, created_at, is_example, keys_json) values ($1,$2,$3,$4,$5,$6)`,
    [id, parentId, trimmed, nowIstStamp(), parent[0].is_example, keysJson],
  );
  return { ok: true as const, id };
}

async function deliverWebPush(sub: { endpoint: string; keys_json: string | null }, title: string, body: string, url: string) {
  if (!sub.endpoint.startsWith("http")) return "mock";
  let keys: PushKeys = {};
  try {
    keys = sub.keys_json ? (JSON.parse(sub.keys_json) as PushKeys) : {};
  } catch {
    keys = {};
  }
  if (!keys.p256dh || !keys.auth) return "no_keys";
  const pair = await vapidPair();
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:saathi@localhost", pair.publicKey, pair.privateKey);
  await webpush.sendNotification(
    { endpoint: sub.endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
    JSON.stringify({ title, body, url }),
  );
  return "sent";
}

export async function sendPushToFamily(parentId: string, title: string, body: string, idempotencyKey: string) {
  if (killSwitchOn()) return { ok: false as const, status: "kill_switch" as const, results: [] };
  const children = await childrenFor(parentId);
  const subs = await query<{ id: string; endpoint: string; keys_json: string | null }>(
    `select id, endpoint, keys_json from push_subscriptions where parent_id = $1`,
    [parentId],
  );
  const desk = await query<{ token: string }>(`select token from magic_links where parent_id = $1 limit 1`, [parentId]);
  const url = `${publicBaseUrl()}/d/${desk[0]?.token || ""}`;
  let delivery = "no_subscription";
  for (const sub of subs) {
    try {
      const status = await deliverWebPush(sub, title, body, `${url}/alerts`);
      if (status === "sent" || status === "mock") delivery = status;
    } catch {
      delivery = "failed";
    }
  }
  const results = [];
  for (const child of children) {
    const gate = gateOutbound("push", child.phone);
    const id = `out_push_${idempotencyKey}_${child.phone.replace(/\s/g, "")}`.slice(0, 80);
    const existing = await query<{ id: string }>(`select id from outbound_messages where id = $1`, [id]);
    if (existing[0]) {
      results.push({ ok: true, id, status: "duplicate" });
      continue;
    }
    const status = !gate.ok ? `blocked_${gate.reason}` : delivery === "sent" ? "sent" : isMockWhatsapp() ? "mock" : subs.length ? delivery : "no_subscription";
    await logOutbound({
      id,
      parentId,
      channel: "push",
      template: "web_push",
      to: gate.ok ? gate.to : child.phone,
      body: `${title}\n${body}`,
      status,
    });
    results.push({ ok: status === "mock" || status === "queued" || status === "sent", id, status });
  }
  return { ok: true as const, results };
}
