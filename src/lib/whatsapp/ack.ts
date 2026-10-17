import { query } from "@/lib/db/client";
import { alertById } from "@/lib/db/queries";
import { nowIstStamp } from "@/lib/time";
import { broadcastAck } from "@/lib/whatsapp/notify";

export async function ackAlert(alertId: string, actor: string) {
  const alert = await alertById(alertId);
  if (!alert) return { ok: false as const, reason: "missing" };
  if (alert.acked_at) {
    return { ok: true as const, first: false as const, acked_by: alert.acked_by };
  }
  const at = nowIstStamp();
  await query(`update alerts set acked_at = $2, acked_by = $3 where id = $1 and acked_at is null`, [
    alertId,
    at,
    actor,
  ]);
  const won = await query<{ acked_by: string | null }>(`select acked_by from alerts where id = $1`, [alertId]);
  if (won[0]?.acked_by && won[0].acked_by !== actor) {
    return { ok: true as const, first: false as const, acked_by: won[0].acked_by };
  }
  await query(`insert into alert_events values ($1,$2,$3,$4,$5,$6,$7)`, [
    `ae_${alertId}_ack_${actor.replace(/\s/g, "_")}`,
    alertId,
    at,
    "acked",
    actor,
    "I'm going",
    true,
  ]);
  await broadcastAck(alert.parent_id, alertId, actor);
  return { ok: true as const, first: true as const, acked_by: actor };
}

export function parseAckIntent(text: string) {
  const raw = text.trim().toLowerCase();
  if (/i'?m (going|on it)|jaa raha|jaa rahi|मैं जा/.test(raw)) return "ack" as const;
  if (/can'?t|abhi nahi|नहीं/.test(raw)) return "cant" as const;
  return null;
}

export function parseAlertId(payload?: string) {
  if (!payload) return null;
  const match = payload.match(/^(?:ack|going|onit):(.+)$/i);
  return match?.[1] ?? null;
}
