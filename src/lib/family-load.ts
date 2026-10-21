import { connection } from "next/server";
import {
  backfillAlertsFromTranscripts,
  callNeedsBolnaHydrate,
  hydrateBolnaCall,
  importRecentBolnaExecutions,
} from "@/lib/bolna/execution";
import { deskSnapshotByToken } from "@/lib/db/queries";
import { defaultLadder } from "@/lib/config";
import type { Lang } from "@/lib/i18n/messages";
import { minutesNowIst, parseHhMm } from "@/lib/time";
import { dedupeDoses, todayStatus } from "@/lib/today";

export function readLang(value?: string): Lang {
  return value === "hi" ? "hi" : "en";
}

export type FamilyDesk = NonNullable<Awaited<ReturnType<typeof loadFamily>>>;

export async function loadFamily(token: string, opts?: { allAlerts?: boolean; hydrateBolna?: boolean }) {
  await connection();
  let snap = await deskSnapshotByToken(token);
  if (!snap) return null;
  if (opts?.hydrateBolna !== false && !snap.parent.is_example) {
    const recent = [snap.call, snap.yesterday, ...snap.weekCalls].filter(Boolean);
    const needsPull = !snap.call || recent.some((call) => call && callNeedsBolnaHydrate(call));
    if (needsPull) await importRecentBolnaExecutions(snap.parent);
    if (snap.call) await hydrateBolnaCall(snap.call);
    if (snap.yesterday) await hydrateBolnaCall(snap.yesterday);
    for (const call of snap.weekCalls.slice(0, 6)) await hydrateBolnaCall(call);
    await backfillAlertsFromTranscripts(snap.parent.id);
    snap = (await deskSnapshotByToken(token)) ?? snap;
  }
  const uniqueDoses = dedupeDoses(snap.doses);
  const escalated = snap.attempts.some((a) => a.result === "escalated");
  return {
    parent: snap.parent,
    contacts: snap.contacts,
    medicines: [],
    actAlerts: snap.actAlerts,
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
      actAlerts: snap.actAlerts,
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
