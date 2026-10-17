import { query } from "@/lib/db/client";
import { ensureSeed } from "@/lib/db/seed";
import type {
  AlertEvent,
  AlertRow,
  AttemptRow,
  CallRow,
  Contact,
  DoseLog,
  Medicine,
  Parent,
} from "@/lib/db/types";
import { istDayBounds, nowIstStamp } from "@/lib/time";

export async function parentByToken(token: string) {
  await ensureSeed();
  const rows = await query<Parent & { expires_at: string }>(
    `select p.*, m.expires_at
     from magic_links m
     join parents p on p.id = m.parent_id
     where m.token = $1`,
    [token],
  );
  const row = rows[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return row;
}

export async function contactsFor(parentId: string) {
  return query<Contact>(`select * from contacts where parent_id = $1`, [parentId]);
}

export async function medicinesFor(parentId: string) {
  return query<Medicine>(`select * from medicines where parent_id = $1`, [parentId]);
}

export async function callOnDay(parentId: string, day: string) {
  const { start, end } = istDayBounds(day);
  const rows = await query<CallRow>(
    `select * from calls where parent_id = $1 and started_at >= $2 and started_at < $3 order by started_at desc limit 1`,
    [parentId, start, end],
  );
  return rows[0] ?? null;
}

export async function attemptsFor(callId: string) {
  return query<AttemptRow>(
    `select * from call_attempts where call_id = $1 order by offset_min`,
    [callId],
  );
}

export async function dosesOnDay(parentId: string, day: string) {
  return query<DoseLog>(
    `select distinct on (m.id)
        coalesce(d.id, m.id) as id,
        m.id as medicine_id,
        coalesce(d.schedule_date, $2) as schedule_date,
        coalesce(d.status, 'not_asked') as status,
        d.said,
        m.name,
        m.dose,
        m.meal
     from medicines m
     left join dose_logs d on d.medicine_id = m.id and d.schedule_date = $2
     where m.parent_id = $1
     order by m.id, d.id desc`,
    [parentId, day],
  );
}

export async function openActAlerts(parentId: string) {
  return query<AlertRow>(
    `select * from alerts
     where parent_id = $1 and level = 'act' and resolved_at is null
     order by created_at desc`,
    [parentId],
  );
}

export async function alertsFor(parentId: string) {
  return query<AlertRow>(
    `select a.*, exists(
        select 1 from alert_events e where e.alert_id = a.id and e.kind = 'false_alarm'
      ) as is_false
     from alerts a
     where a.parent_id = $1
     order by a.resolved_at is null desc, a.created_at desc`,
    [parentId],
  );
}

export async function alertById(id: string) {
  const rows = await query<AlertRow>(`select * from alerts where id = $1`, [id]);
  return rows[0] ?? null;
}

export async function alertEvents(alertId: string) {
  return query<AlertEvent>(
    `select * from alert_events where alert_id = $1 order by at`,
    [alertId],
  );
}

export async function callById(id: string) {
  const rows = await query<CallRow>(`select * from calls where id = $1`, [id]);
  return rows[0] ?? null;
}

export async function historyDays(parentId: string, days: number) {
  const rows = await query<CallRow>(
    `select * from calls where parent_id = $1 order by started_at desc limit $2`,
    [parentId, days],
  );
  const doses = await query<DoseLog>(
    `select * from dose_logs where parent_id = $1 order by schedule_date desc`,
    [parentId],
  );
  const alerts = await query<AlertRow>(
    `select * from alerts where parent_id = $1 order by created_at desc`,
    [parentId],
  );
  return { calls: rows, doses, alerts };
}

export { todayStatus } from "@/lib/today";

export async function resolveAlert(
  id: string,
  actor = "family",
  kind: "resolved" | "false_alarm" = "resolved",
) {
  const existing = await alertById(id);
  if (!existing || existing.resolved_at) return;
  const at = nowIstStamp();
  await query(`update alerts set resolved_at = $2 where id = $1 and resolved_at is null`, [id, at]);
  await query(`insert into alert_events values ($1,$2,$3,$4,$5,$6,$7)`, [
    `ae_res_${id}_${at}_${kind}`,
    id,
    at,
    kind,
    actor,
    kind === "false_alarm" ? "False alarm" : "Maa is OK",
    true,
  ]);
}

export async function setPaused(parentId: string, paused: boolean) {
  await query(`update parents set paused = $2 where id = $1`, [parentId, paused]);
}
