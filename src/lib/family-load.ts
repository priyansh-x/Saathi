import { connection } from "next/server";
import { ensureExampleTodayDesk } from "@/lib/bolna/example-desk";
import { backfillAlertsFromTranscripts, callNeedsBolnaHydrate, hydrateBolnaCall, syncDeskFromBolna } from "@/lib/bolna/execution";
import { defaultLadder } from "@/lib/config";
import { deskSnapshotByToken } from "@/lib/db/queries";
import type { Lang } from "@/lib/i18n/messages";
import type { AlertRow, CallRow } from "@/lib/db/types";
import { minutesNowIst, parseHhMm } from "@/lib/time";
import { dedupeDoses, todayStatus } from "@/lib/today";

/** Today’s act banner follows this morning’s latest ring, not an earlier same-day miss. */
export function todayDeskAlerts(
  actAlerts: AlertRow[],
  todayCallIds: Set<string>,
  latest?: Pick<CallRow, "id" | "status"> | null,
) {
  return actAlerts.filter((alert) => {
    if (!alert.call_id || !todayCallIds.has(alert.call_id)) return false;
    if (
      alert.category === "MISSED" &&
      latest &&
      (latest.status === "completed" || latest.status === "no_conversation") &&
      alert.call_id !== latest.id
    ) {
      return false;
    }
    return true;
  });
}

export function readLang(value?: string): Lang {
  return value === "hi" ? "hi" : "en";
}

export type FamilyDesk = NonNullable<Awaited<ReturnType<typeof loadFamily>>>;

export async function loadFamily(token: string, opts?: { allAlerts?: boolean; hydrateBolna?: boolean }) {
  await connection();
  let snap = await deskSnapshotByToken(token);
  if (!snap) return null;
  if (snap.parent.is_example) {
    await ensureExampleTodayDesk(snap.parent.id);
    snap = (await deskSnapshotByToken(token)) ?? snap;
  }
  if (!snap) return null;
  if (opts?.hydrateBolna !== false) {
    const desk = snap;
    const todayCalls = desk.weekCalls.filter((call) => call.started_at.startsWith(desk.day));
    const recent = [desk.call, desk.yesterday, ...todayCalls, ...desk.weekCalls.slice(0, 8)];
    const needsPull = !desk.call || recent.some((call) => call && callNeedsBolnaHydrate(call));
    if (needsPull) await syncDeskFromBolna(desk.parent, desk.call, fetch, { importRecent: true });
    if (desk.yesterday) await hydrateBolnaCall(desk.yesterday);
    for (const call of todayCalls) await hydrateBolnaCall(call);
    await backfillAlertsFromTranscripts(desk.parent.id);
    snap = (await deskSnapshotByToken(token)) ?? desk;
  }
  if (!snap) return null;
  const uniqueDoses = dedupeDoses(snap.doses);
  const escalated = snap.attempts.some((a) => a.result === "escalated");
  const todayCallIds = new Set(
    [snap.call, ...snap.weekCalls]
      .filter((call): call is NonNullable<typeof call> => Boolean(call?.id && call.started_at.startsWith(snap.day)))
      .map((call) => call.id),
  );
  const actAlerts = todayDeskAlerts(snap.actAlerts, todayCallIds, snap.call);
  return {
    parent: snap.parent,
    contacts: snap.contacts,
    medicines: [],
    actAlerts,
    allAlerts: [],
    day: snap.day,
    call: snap.call,
    yesterday: snap.yesterday,
    doses: uniqueDoses,
    week: { calls: snap.weekCalls, doses: [], alerts: [] },
    attempts: snap.attempts,
    plan: snap.plan ?? defaultLadder(),
    status: todayStatus({
      paused: snap.parent.paused,
      call: snap.call,
      doses: uniqueDoses,
      actAlerts,
      nowMin: minutesNowIst(),
      callTimeMin: parseHhMm(snap.parent.call_time),
      escalated,
      neverCalled: snap.weekCalls.length === 0,
    }),
    child: snap.contacts.find((c) => c.role === "child") ?? null,
    neighbour: snap.contacts.find((c) => c.role === "neighbour") ?? null,
    neighbourReady: snap.neighbourReady,
    weekly: { monday: snap.day, built: null as null, sent: null as null },
    delivery: null as { name: string; clock: string; line: string } | null,
    couldntReach: null as { name: string } | null,
  };
}
