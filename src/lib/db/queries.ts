import { EXAMPLE_TOKEN } from "@/lib/config";
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
import { istDayBounds, istDayKey, istDayOffset, nowIstStamp } from "@/lib/time";
import type { LadderPlan } from "@/lib/today";

function asJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

export async function deskSnapshotByToken(token: string) {
  if (token === EXAMPLE_TOKEN) await ensureSeed();
  const day = istDayKey();
  const yesterday = istDayOffset(-1);
  const weekStart = istDayOffset(-6);
  const todayBounds = istDayBounds(day);
  const yesterdayBounds = istDayBounds(yesterday);
  const weekBounds = istDayBounds(weekStart);
  const rows = await query<{
    id: string;
    full_name: string;
    first_name: string;
    city: string;
    timezone: string;
    phone: string;
    languages: string;
    call_time: string;
    paused: boolean;
    recording_consent: boolean;
    is_example: boolean;
    consent_status: Parent["consent_status"];
    consent_at: string | null;
    consent_later_count: number;
    address_term: string | null;
    link_expires_at: string;
    contacts: unknown;
    act_alerts: unknown;
    today_call: unknown;
    yesterday_call: unknown;
    doses: unknown;
    week_calls: unknown;
    plan: unknown;
    neighbour_ready: boolean;
    attempts: unknown;
  }>(
    `select
        p.id, p.full_name, p.first_name, p.city, p.timezone, p.phone, p.languages,
        p.call_time, p.paused, p.recording_consent, p.is_example, p.consent_status,
        p.consent_at, p.consent_later_count, p.address_term,
        m.expires_at as link_expires_at,
        (select coalesce(json_agg(c.*), '[]'::json) from contacts c where c.parent_id = p.id) as contacts,
        (select coalesce(json_agg(a.*), '[]'::json)
           from alerts a
          where a.parent_id = p.id and a.level = 'act' and a.resolved_at is null) as act_alerts,
        (select row_to_json(t) from (
            select * from calls
             where parent_id = p.id and started_at >= $2 and started_at < $3
             order by started_at desc limit 1
        ) t) as today_call,
        (select row_to_json(y) from (
            select * from calls
             where parent_id = p.id and started_at >= $4 and started_at < $5
             order by started_at desc limit 1
        ) y) as yesterday_call,
        (select coalesce(json_agg(d), '[]'::json) from (
            select distinct on (med.id)
              coalesce(dl.id, med.id) as id,
              med.id as medicine_id,
              coalesce(dl.schedule_date, $6) as schedule_date,
              coalesce(dl.status, 'not_asked') as status,
              dl.said,
              med.name,
              med.dose,
              med.meal
            from medicines med
            left join dose_logs dl on dl.medicine_id = med.id and dl.schedule_date = $6
            left join calls cl on cl.id = dl.call_id
            where med.parent_id = p.id
            order by med.id, coalesce(cl.started_at, '') desc, dl.id desc
        ) d) as doses,
        (select coalesce(json_agg(w.* order by w.started_at desc), '[]'::json)
           from calls w
          where w.parent_id = p.id and w.started_at >= $7) as week_calls,
        (select row_to_json(cfg) from (
            select retry_10, retry_25, soft_30, last_45, escalate_60
              from family_config where parent_id = p.id
        ) cfg) as plan,
        exists(
          select 1 from consents
           where parent_id = p.id and kind = 'neighbour_whatsapp' and granted = true
        ) as neighbour_ready,
        (select coalesce(json_agg(k.*), '[]'::json)
           from call_attempts k
          where k.call_id = (
            select id from calls
             where parent_id = p.id and started_at >= $2 and started_at < $3
             order by started_at desc limit 1
          )) as attempts
       from magic_links m
       join parents p on p.id = m.parent_id
      where m.token = $1
      limit 1`,
    [token, todayBounds.start, todayBounds.end, yesterdayBounds.start, yesterdayBounds.end, day, weekBounds.start],
  );
  const row = rows[0];
  if (!row) return null;
  if (new Date(row.link_expires_at).getTime() < Date.now()) return null;
  const parent: Parent = {
    id: row.id,
    full_name: row.full_name,
    first_name: row.first_name,
    city: row.city,
    timezone: row.timezone,
    phone: row.phone,
    languages: row.languages,
    call_time: row.call_time,
    paused: row.paused,
    recording_consent: row.recording_consent,
    is_example: row.is_example,
    consent_status: row.consent_status,
    consent_at: row.consent_at,
    consent_later_count: row.consent_later_count ?? 0,
    address_term: row.address_term,
  };
  return {
    parent,
    contacts: asJson<Contact[]>(row.contacts, []),
    actAlerts: asJson<AlertRow[]>(row.act_alerts, []),
    call: asJson<CallRow | null>(row.today_call, null),
    yesterday: asJson<CallRow | null>(row.yesterday_call, null),
    doses: asJson<DoseLog[]>(row.doses, []),
    weekCalls: asJson<CallRow[]>(row.week_calls, []),
    plan: asJson<LadderPlan | null>(row.plan, null),
    neighbourReady: Boolean(row.neighbour_ready),
    attempts: asJson<AttemptRow[]>(row.attempts, []),
    day,
  };
}

export async function parentByToken(token: string) {
  if (token === EXAMPLE_TOKEN) await ensureSeed();
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

export async function medicinesWithTimes(parentId: string) {
  return query<Medicine & { time_local: string | null }>(
    `select m.*, s.time_local
     from medicines m
     left join schedules s on s.medicine_id = m.id
     where m.parent_id = $1
     order by m.id`,
    [parentId],
  );
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
     left join calls cl on cl.id = d.call_id
     where m.parent_id = $1
     order by m.id, coalesce(cl.started_at, '') desc, d.id desc`,
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
        select 1 from alert_events e where e.alert_id = a.id and e.kind in ('false_alarm', 'resolved_false')
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
  const rows = await query<CallRow>(
    `select * from calls where id = $1 or bolna_execution_id = $1 order by started_at desc limit 1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function callsSince(parentId: string, day: string) {
  const { start } = istDayBounds(day);
  return query<CallRow>(
    `select * from calls where parent_id = $1 and started_at >= $2 order by started_at desc`,
    [parentId, start],
  );
}

export async function historyDays(parentId: string, days: number) {
  const [rows, doses, alerts] = await Promise.all([
    query<CallRow>(`select * from calls where parent_id = $1 order by started_at desc limit $2`, [
      parentId,
      Math.max(days, 200),
    ]),
    query<DoseLog>(`select * from dose_logs where parent_id = $1 order by schedule_date desc`, [parentId]),
    query<AlertRow>(`select * from alerts where parent_id = $1 order by created_at desc`, [parentId]),
  ]);
  return { calls: rows, doses, alerts };
}

export { todayStatus } from "@/lib/today";

export async function resolveAlert(
  id: string,
  actor = "family",
  kind: "resolved" | "false_alarm" | "resolved_false" = "resolved",
) {
  const existing = await alertById(id);
  if (!existing || existing.resolved_at) return;
  const at = nowIstStamp();
  const eventKind = kind === "resolved_false" ? "resolved_false" : kind;
  await query(`update alerts set resolved_at = $2 where id = $1 and resolved_at is null`, [id, at]);
  await query(`insert into alert_events values ($1,$2,$3,$4,$5,$6,$7)`, [
    `ae_res_${id}_${at}_${eventKind}`,
    id,
    at,
    eventKind,
    actor,
    eventKind === "false_alarm" || eventKind === "resolved_false" ? "False alarm" : "Maa is OK",
    true,
  ]);
}

export async function setPaused(parentId: string, paused: boolean) {
  await query(`update parents set paused = $2 where id = $1`, [parentId, paused]);
}
