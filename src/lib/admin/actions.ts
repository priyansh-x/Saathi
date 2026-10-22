import { ackAlert } from "@/lib/whatsapp/ack";
import { backfillAlertsFromTranscripts } from "@/lib/bolna/execution";
import { placeExampleDeskCall } from "@/lib/bolna/example-desk";
import { placeTestCall } from "@/lib/bolna/place";
import { query } from "@/lib/db/client";
import { resolveAlert } from "@/lib/db/queries";
import { setOpsKillSwitch } from "@/lib/ops/kill-switch";
import { updatePaused } from "@/lib/settings";

export type AdminActionName =
  | "pause"
  | "resume"
  | "ring"
  | "ack_alert"
  | "resolve_alert"
  | "false_alarm"
  | "backfill"
  | "kill_on"
  | "kill_off";

export async function runAdminAction(input: {
  action: AdminActionName;
  parentId?: string;
  alertId?: string;
  who: string;
}) {
  const { action, parentId, alertId, who } = input;
  if (action === "kill_on") {
    await setOpsKillSwitch(true, who);
    return { ok: true as const };
  }
  if (action === "kill_off") {
    await setOpsKillSwitch(false, who);
    return { ok: true as const };
  }
  if (!parentId) return { ok: false as const, error: "missing_parent" };
  const parent = await query<{ id: string; is_example: boolean }>(`select id, is_example from parents where id = $1`, [
    parentId,
  ]);
  if (!parent[0]) return { ok: false as const, error: "unknown_parent" };
  if (action === "pause") {
    await updatePaused(parentId, true, who);
    return { ok: true as const };
  }
  if (action === "resume") {
    await updatePaused(parentId, false, who);
    return { ok: true as const };
  }
  if (action === "ring") {
    const placed = parent[0].is_example ? await placeExampleDeskCall(parentId) : await placeTestCall(parentId);
    return placed.ok ? { ok: true as const, execution_id: placed.execution_id } : { ok: false as const, error: placed.reason };
  }
  if (action === "backfill") {
    const n = await backfillAlertsFromTranscripts(parentId);
    return { ok: true as const, raised: n };
  }
  if (!alertId) return { ok: false as const, error: "missing_alert" };
  if (action === "ack_alert") {
    await ackAlert(alertId, who);
    return { ok: true as const };
  }
  if (action === "resolve_alert") {
    await resolveAlert(alertId, who, "resolved");
    return { ok: true as const };
  }
  if (action === "false_alarm") {
    await resolveAlert(alertId, who, "false_alarm");
    return { ok: true as const };
  }
  return { ok: false as const, error: "unknown_action" };
}
