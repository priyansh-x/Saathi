import { query } from "@/lib/db/client";

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
  await query(`delete from family_config where parent_id = $1`, [parentId]);
  await query(`delete from tool_call_logs where parent_id = $1`, [parentId]);
  await query(`delete from parents where id = $1`, [parentId]);
}
