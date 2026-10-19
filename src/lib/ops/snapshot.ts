import { callProviderName, isMockBolna, isMockEmail, isMockWhatsapp, killSwitchOn } from "@/lib/config";
import { recentErrors } from "@/lib/log-error";
import { query } from "@/lib/db/client";
import { loadBolnaReadiness } from "@/lib/ops/bolna-readiness";
import { loadWhatsappReadiness } from "@/lib/ops/whatsapp-readiness";
import { listMockPendingCodes } from "@/lib/auth/code";
import { waitlistSignupCount } from "@/lib/ops/waitlist-count";
import { maskPhone } from "@/lib/ops/mask";
import { istDayBounds, istDayKey } from "@/lib/time";

export type FamilyStatusCount = { status: string; n: number };
export type CallStatusCount = { status: string; n: number };
export type OpsOutbound = { kind: string; gate: string; at: string; to: string; delivery: string };
export type OpsAlert = { id: string; category: string; level: string; at: string; late: boolean };

export async function loadOpsSnapshot(now = new Date()) {
  const families = await query<{ paused: boolean; consent_status: string }>(
    `select paused, consent_status from parents`,
  );
  const byStatus = new Map<string, number>();
  for (const row of families) {
    const status = row.paused ? "paused" : row.consent_status || "pending";
    byStatus.set(status, (byStatus.get(status) || 0) + 1);
  }
  const familyCounts: FamilyStatusCount[] = [...byStatus.entries()].map(([status, n]) => ({ status, n }));

  const { start, end } = istDayBounds(istDayKey(now));
  const todayCalls = await query<CallStatusCount>(
    `select status, count(*)::int as n from calls
     where started_at >= $1 and started_at < $2
     group by status
     order by status`,
    [start, end],
  );

  const outboundRows = await query<{
    channel: string;
    status: string;
    at: string;
    to_phone: string;
    delivery_status: string | null;
  }>(
    `select channel, status, at, to_phone, delivery_status from outbound_messages order by at desc, id desc limit 50`,
  );
  const outbound: OpsOutbound[] = outboundRows.map((row) => ({
    kind: row.channel,
    gate: row.status,
    at: row.at,
    to: maskPhone(row.to_phone),
    delivery: row.delivery_status || "—",
  }));

  const openAlerts = await query<OpsAlert>(
    `select id, category, level, created_at as at, late from alerts
     where resolved_at is null
     order by created_at desc, id desc
     limit 50`,
  );

  const audits = await query<{ id: string; who: string; what: string; at: string }>(
    `select id, who, what, at from ops_audit order by at desc, id desc limit 20`,
  );

  return {
    familyCount: families.length,
    familyCounts,
    todayCalls,
    outbound,
    openAlerts,
    killSwitch: {
      on: killSwitchOn(),
      env: process.env.SAATHI_KILL_SWITCH === "1",
    },
    flags: {
      callProvider: callProviderName(),
      mockBolna: isMockBolna(),
      mockWhatsapp: isMockWhatsapp(),
      mockEmail: isMockEmail(),
    },
    audits,
    errors: await recentErrors(20),
    bolna: await loadBolnaReadiness(),
    whatsapp: await loadWhatsappReadiness(),
    waitlistCount: await waitlistSignupCount(),
    pendingCodes: await listMockPendingCodes(),
  };
}
