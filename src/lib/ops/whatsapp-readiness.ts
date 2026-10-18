import { query } from "@/lib/db/client";
import { nowIstStamp } from "@/lib/time";
import type { ReadinessCheck } from "@/lib/ops/bolna-readiness";

function set(value: string | undefined) {
  return Boolean(value && value.trim());
}

export function whatsappEnvChecks(): ReadinessCheck[] {
  return [
    {
      id: "token",
      label: "Token set",
      ok: set(process.env.WHATSAPP_TOKEN),
      detail: set(process.env.WHATSAPP_TOKEN) ? "set" : "missing",
    },
    {
      id: "phone_number_id",
      label: "Phone number id set",
      ok: set(process.env.WHATSAPP_PHONE_NUMBER_ID),
      detail: set(process.env.WHATSAPP_PHONE_NUMBER_ID) ? "set" : "missing",
    },
    {
      id: "app_secret",
      label: "App secret set",
      ok: set(process.env.WHATSAPP_APP_SECRET),
      detail: set(process.env.WHATSAPP_APP_SECRET) ? "set" : "missing",
    },
  ];
}

export async function markWhatsappWebhookVerified() {
  const at = nowIstStamp();
  await query(
    `insert into ops_flags (key, value, updated_at, updated_by)
     values ('whatsapp_webhook_verified', '1', $1, 'meta')
     on conflict (key) do update set value = '1', updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    [at],
  );
}

export async function whatsappWebhookVerified() {
  try {
    const rows = await query<{ value: string }>(
      `select value from ops_flags where key = 'whatsapp_webhook_verified'`,
    );
    return rows[0]?.value === "1";
  } catch {
    return false;
  }
}

export async function loadWhatsappReadiness() {
  const checks = whatsappEnvChecks();
  const verified = await whatsappWebhookVerified();
  checks.push({
    id: "webhook_verified",
    label: "Webhook verified",
    ok: verified,
    detail: verified ? "verified" : "not yet",
  });

  const inbound = await query<{ at: string | null }>(
    `select max(last_inbound_at) as at from contacts where last_inbound_at is not null`,
  );
  const lastInboundAt = inbound[0]?.at ?? null;
  checks.push({
    id: "last_inbound",
    label: "Last inbound",
    ok: Boolean(lastInboundAt),
    detail: lastInboundAt ? lastInboundAt : "none yet",
  });

  const statusHook = await query<{ at: string }>(
    `select at from webhook_events
     where source = 'whatsapp' and execution_id = 'status'
     order by at desc, id desc limit 1`,
  );
  const statusRow = await query<{ at: string }>(
    `select delivery_at as at from outbound_messages
     where delivery_at is not null and coalesce(delivery_status, '') in ('sent','delivered','read','failed')
     order by delivery_at desc, id desc limit 1`,
  );
  const lastStatusAt = statusHook[0]?.at ?? statusRow[0]?.at ?? null;
  checks.push({
    id: "last_status",
    label: "Last status received",
    ok: Boolean(lastStatusAt),
    detail: lastStatusAt ? lastStatusAt : "none yet",
  });

  return {
    checks,
    allGreen: checks.every((c) => c.ok),
    lastInboundAt,
    lastStatusAt,
  };
}
