import { query } from "@/lib/db/client";
import { callProviderName, isMockBolna, isMockEmail, isMockWhatsapp, killSwitchOn, publicBaseUrl } from "@/lib/config";
import { istDayBounds, istDayKey } from "@/lib/time";
import { callTranscriptLines } from "@/lib/history";
import { recentErrors } from "@/lib/log-error";
import { waitlistSignupCount } from "@/lib/ops/waitlist-count";
import type { AlertRow, CallRow, Contact, Medicine, Parent } from "@/lib/db/types";

export type AdminHouseholdRow = Parent & {
  call_count: number;
  open_alerts: number;
  last_call_at: string | null;
  last_call_status: string | null;
  desk_token: string | null;
  owner_email: string | null;
};

export async function loadAdminOverview() {
  const { start, end } = istDayBounds(istDayKey());
  const [
    households,
    todayCalls,
    openAlerts,
    accounts,
    recentCalls,
    outbound,
    errors,
    pendingCodes,
    pushN,
    waitlist,
    webhooks,
  ] = await Promise.all([
    query<AdminHouseholdRow>(
      `select p.*,
              (select count(*)::int from calls c where c.parent_id = p.id) as call_count,
              (select count(*)::int from alerts a where a.parent_id = p.id and a.resolved_at is null) as open_alerts,
              (select max(c.started_at) from calls c where c.parent_id = p.id) as last_call_at,
              (select c.status from calls c where c.parent_id = p.id order by c.started_at desc limit 1) as last_call_status,
              (select m.token from magic_links m where m.parent_id = p.id limit 1) as desk_token,
              (select ct.email from contacts ct where ct.parent_id = p.id and ct.email is not null and ct.email <> '' order by ct.is_owner desc limit 1) as owner_email
         from parents p
        order by p.is_example asc, last_call_at desc nulls last, p.first_name`,
    ),
    query<{ status: string; n: number }>(
      `select status, count(*)::int as n from calls
        where started_at >= $1 and started_at < $2
        group by status order by status`,
      [start, end],
    ),
    query<AlertRow>(
      `select * from alerts where resolved_at is null order by created_at desc limit 40`,
    ),
    query<{
      email: string;
      full_name: string;
      role: string;
      is_owner: boolean;
      parent_id: string;
      parent_name: string;
      last_inbound_at: string | null;
    }>(
      `select c.email, c.full_name, c.role, coalesce(c.is_owner, false) as is_owner,
              c.parent_id, p.first_name as parent_name, c.last_inbound_at
         from contacts c
         join parents p on p.id = c.parent_id
        where c.email is not null and trim(c.email) <> ''
        order by c.email`,
    ),
    query<CallRow>(`select * from calls order by started_at desc limit 12`),
    query<{ id: string; parent_id: string; channel: string; template: string; to_phone: string; status: string; at: string; body: string }>(
      `select id, parent_id, channel, template, to_phone, status, at, body
         from outbound_messages order by at desc limit 30`,
    ),
    recentErrors(15),
    query<{ email: string; created_at: string; consumed_at: string | null; expires_at: string }>(
      `select email, created_at, consumed_at, expires_at from auth_codes order by created_at desc limit 20`,
    ).catch(() => []),
    query<{ n: number }>(`select count(*)::int as n from push_subscriptions`).then((rows) => rows[0]?.n ?? 0),
    waitlistSignupCount(),
    query<{ id: string; source: string; execution_id: string | null; at: string; processed: boolean }>(
      `select id, source, execution_id, at, processed from webhook_events order by at desc limit 20`,
    ).catch(() => []),
  ]);

  return {
    households,
    todayCalls,
    openAlerts,
    accounts,
    recentCalls,
    outbound,
    errors,
    pendingCodes,
    pushN,
    waitlist,
    webhooks,
    flags: {
      callProvider: callProviderName(),
      mockBolna: isMockBolna(),
      mockWhatsapp: isMockWhatsapp(),
      mockEmail: isMockEmail(),
      killSwitch: killSwitchOn(),
      killEnv: process.env.SAATHI_KILL_SWITCH === "1",
      publicBase: publicBaseUrl(),
    },
  };
}

export async function loadAdminHousehold(parentId: string) {
  const parents = await query<Parent>(`select * from parents where id = $1`, [parentId]);
  const parent = parents[0];
  if (!parent) return null;
  const [contacts, medicines, calls, alerts, doses, consents, outbound, notes, links, push, attempts, config] =
    await Promise.all([
      query<Contact>(`select * from contacts where parent_id = $1 order by role, first_name`, [parentId]),
      query<Medicine & { time_local: string | null }>(
        `select m.*, s.time_local from medicines m
          left join schedules s on s.medicine_id = m.id
         where m.parent_id = $1 order by m.id`,
        [parentId],
      ),
      query<CallRow>(`select * from calls where parent_id = $1 order by started_at desc limit 80`, [parentId]),
      query<AlertRow>(`select * from alerts where parent_id = $1 order by created_at desc limit 40`, [parentId]),
      query<{ id: string; medicine_id: string; status: string; schedule_date: string; said: string | null; name: string }>(
        `select d.id, d.medicine_id, d.status, d.schedule_date, d.said, m.name
           from dose_logs d join medicines m on m.id = d.medicine_id
          where d.parent_id = $1 order by d.schedule_date desc, d.id desc limit 40`,
        [parentId],
      ),
      query<{ kind: string; granted: boolean; at: string; evidence: string | null }>(
        `select kind, granted, at, evidence from consents where parent_id = $1 order by at desc`,
        [parentId],
      ),
      query<{ id: string; channel: string; template: string; to_phone: string; status: string; at: string; body: string }>(
        `select id, channel, template, to_phone, status, at, body from outbound_messages
          where parent_id = $1 order by at desc limit 40`,
        [parentId],
      ),
      query<{ kind: string; note: string; call_id: string | null }>(
        `select kind, note, call_id from memory_notes where parent_id = $1 order by id desc limit 20`,
        [parentId],
      ),
      query<{ token: string; expires_at: string }>(`select token, expires_at from magic_links where parent_id = $1`, [
        parentId,
      ]),
      query<{ id: string; endpoint: string; created_at: string }>(
        `select id, endpoint, created_at from push_subscriptions where parent_id = $1`,
        [parentId],
      ),
      query<{ call_id: string; offset_min: number; result: string; attempted_at: string }>(
        `select a.call_id, a.offset_min, a.result, a.attempted_at
           from call_attempts a
           join calls c on c.id = a.call_id
          where c.parent_id = $1
          order by a.attempted_at desc limit 30`,
        [parentId],
      ),
      query<{ retry_10: number; retry_25: number; soft_30: number; last_45: number; escalate_60: number }>(
        `select retry_10, retry_25, soft_30, last_45, escalate_60 from family_config where parent_id = $1`,
        [parentId],
      ),
    ]);

  return {
    parent,
    contacts,
    medicines,
    calls: calls.map((call) => ({
      ...call,
      lines: callTranscriptLines(call.transcript_json),
    })),
    alerts,
    doses,
    consents,
    outbound,
    notes,
    links,
    push,
    attempts,
    config: config[0] ?? null,
    deskUrl: links[0] ? `${publicBaseUrl()}/d/${links[0].token}` : null,
  };
}
