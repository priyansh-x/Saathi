import { ackAlert } from "@/lib/whatsapp/ack";
import { backfillAlertsFromTranscripts, hydrateBolnaCall, syncDeskFromBolna } from "@/lib/bolna/execution";
import { placeExampleDeskCall } from "@/lib/bolna/example-desk";
import { placeTestCall } from "@/lib/bolna/place";
import { query } from "@/lib/db/client";
import { resolveAlert } from "@/lib/db/queries";
import { setOpsKillSwitch } from "@/lib/ops/kill-switch";
import { sendPushToFamily } from "@/lib/push";
import { updateCallTime, updatePaused } from "@/lib/settings";
import { sendDailyBriefing } from "@/lib/whatsapp/notify";

export type AdminActionName =
  | "pause"
  | "resume"
  | "ring"
  | "ack_alert"
  | "resolve_alert"
  | "false_alarm"
  | "backfill"
  | "hydrate"
  | "briefing"
  | "push_test"
  | "call_time"
  | "resolve_open"
  | "kill_on"
  | "kill_off";

export const ADMIN_ACTIONS = new Set<AdminActionName>([
  "pause",
  "resume",
  "ring",
  "ack_alert",
  "resolve_alert",
  "false_alarm",
  "backfill",
  "hydrate",
  "briefing",
  "push_test",
  "call_time",
  "resolve_open",
  "kill_on",
  "kill_off",
]);

export async function runAdminAction(input: {
  action: AdminActionName;
  parentId?: string;
  alertId?: string;
  callTime?: string;
  who: string;
}) {
  const { action, parentId, alertId, callTime, who } = input;
  if (action === "kill_on") {
    await setOpsKillSwitch(true, who);
    return { ok: true as const };
  }
  if (action === "kill_off") {
    await setOpsKillSwitch(false, who);
    return { ok: true as const };
  }
  if (!parentId) return { ok: false as const, error: "missing_parent" };
  const parent = await query<{ id: string; is_example: boolean; phone: string }>(
    `select id, is_example, phone from parents where id = $1`,
    [parentId],
  );
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
  if (action === "hydrate") {
    await syncDeskFromBolna(parent[0], null, fetch, { importRecent: true });
    const open = await query<{
      id: string;
      parent_id: string;
      status: string;
      ended_at: string | null;
      transcript_json: string | null;
      duration_sec: number | null;
      bolna_execution_id: string | null;
    }>(
      `select id, parent_id, status, ended_at, transcript_json, duration_sec, bolna_execution_id
         from calls where parent_id = $1 order by started_at desc limit 8`,
      [parentId],
    );
    for (const call of open) await hydrateBolnaCall(call);
    return { ok: true as const };
  }
  if (action === "briefing") {
    const last = await query<{ id: string; mood_quote: string | null; status: "completed" | "missed" | "no_conversation" | "in_progress" | "failed" }>(
      `select id, mood_quote, status from calls where parent_id = $1 and status = 'completed' order by started_at desc limit 1`,
      [parentId],
    );
    if (!last[0]) return { ok: false as const, error: "no_completed_call" };
    await sendDailyBriefing(parentId, last[0]);
    return { ok: true as const };
  }
  if (action === "push_test") {
    await sendPushToFamily(parentId, "Saathi", "Test from admin", `admin_push_${Date.now()}`);
    return { ok: true as const };
  }
  if (action === "call_time") {
    if (!callTime) return { ok: false as const, error: "missing_time" };
    await updateCallTime(parentId, callTime, who);
    return { ok: true as const };
  }
  if (action === "resolve_open") {
    const openAlerts = await query<{ id: string }>(
      `select id from alerts where parent_id = $1 and resolved_at is null`,
      [parentId],
    );
    for (const row of openAlerts) await resolveAlert(row.id, who, "resolved");
    return { ok: true as const };
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
