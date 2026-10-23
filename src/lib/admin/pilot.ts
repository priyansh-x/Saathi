import { query } from "@/lib/db/client";
import { computePilotMetrics, totalPilotRow, type PilotHouseholdMetrics } from "@/lib/admin/pilot-metrics";

export async function loadPilotMetrics(now = new Date()): Promise<{
  rows: PilotHouseholdMetrics[];
  totals: PilotHouseholdMetrics;
}> {
  const households = await query<{
    id: string;
    first_name: string;
    full_name: string;
    consent_at: string | null;
  }>(
    `select id, first_name, full_name, consent_at from parents
      where is_example = false
      order by first_name`,
  );
  const rows: PilotHouseholdMetrics[] = [];
  for (const house of households) {
    const [calls, alerts, views] = await Promise.all([
      query<{ started_at: string; status: string; duration_sec: number | null }>(
        `select started_at, status, duration_sec from calls where parent_id = $1 order by started_at`,
        [house.id],
      ),
      query<{ false_resolved: boolean }>(
        `select exists(
            select 1 from alert_events e
             where e.alert_id = a.id and e.kind in ('false_alarm', 'resolved_false')
          ) as false_resolved
         from alerts a where a.parent_id = $1`,
        [house.id],
      ),
      query<{ at: string }>(`select at::text as at from desk_views where parent_id = $1`, [house.id]),
    ]);
    rows.push(
      computePilotMetrics({
        parentId: house.id,
        name: house.first_name || house.full_name,
        now,
        consentAt: house.consent_at,
        calls,
        alerts: alerts.map((a) => ({ falseResolved: Boolean(a.false_resolved) })),
        views,
      }),
    );
  }
  return { rows, totals: totalPilotRow(rows) };
}
