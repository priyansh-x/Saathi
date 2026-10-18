import { query } from "@/lib/db/client";
import { nowIstStamp } from "@/lib/time";

const PARENT_TABLES = [
  "alerts",
  "calls",
  "consents",
  "contacts",
  "dose_logs",
  "audit_events",
  "family_invites",
  "family_config",
  "magic_links",
  "medicines",
  "memory_notes",
  "outbound_messages",
  "push_subscriptions",
  "tool_call_logs",
] as const;

export async function leftoverParentRows(parentId: string) {
  const leftover: Record<string, number> = {};
  for (const table of PARENT_TABLES) {
    const rows = await query<{ n: number }>(`select count(*)::int as n from ${table} where parent_id = $1`, [parentId]);
    leftover[table] = rows[0]?.n ?? 0;
  }
  const parents = await query<{ n: number }>(`select count(*)::int as n from parents where id = $1`, [parentId]);
  leftover.parents = parents[0]?.n ?? 0;
  return leftover;
}

export async function deleteFamily(parentId: string) {
  const calls = await query<{ id: string }>(`select id from calls where parent_id = $1`, [parentId]);
  const alerts = await query<{ id: string }>(`select id from alerts where parent_id = $1`, [parentId]);
  for (const alert of alerts) {
    await query(`delete from alert_events where alert_id = $1`, [alert.id]);
  }
  for (const call of calls) {
    await query(`delete from call_attempts where call_id = $1`, [call.id]);
    await query(`delete from tool_call_logs where call_sid = $1`, [call.id]);
  }
  await query(`delete from alerts where parent_id = $1`, [parentId]);
  await query(`delete from dose_logs where parent_id = $1`, [parentId]);
  await query(`delete from calls where parent_id = $1`, [parentId]);
  await query(`delete from outbound_messages where parent_id = $1`, [parentId]);
  await query(`delete from memory_notes where parent_id = $1`, [parentId]);
  await query(`delete from consents where parent_id = $1`, [parentId]);
  await query(`delete from magic_links where parent_id = $1`, [parentId]);
  const meds = await query<{ id: string }>(`select id from medicines where parent_id = $1`, [parentId]);
  for (const med of meds) {
    await query(`delete from schedules where medicine_id = $1`, [med.id]);
  }
  await query(`delete from medicines where parent_id = $1`, [parentId]);
  await query(`delete from contacts where parent_id = $1`, [parentId]);
  await query(`delete from family_invites where parent_id = $1`, [parentId]);
  await query(`delete from audit_events where parent_id = $1`, [parentId]);
  await query(`delete from family_config where parent_id = $1`, [parentId]);
  await query(`delete from push_subscriptions where parent_id = $1`, [parentId]);
  await query(`delete from tool_call_logs where parent_id = $1`, [parentId]);
  await query(`delete from webhook_events where payload like $1`, [`%${parentId}%`]);
  await query(`delete from parents where id = $1`, [parentId]);
  await query(`insert into deleted_events values ($1,$2,$3)`, [
    `del_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    nowIstStamp(),
    "family_deleted",
  ]);
}
