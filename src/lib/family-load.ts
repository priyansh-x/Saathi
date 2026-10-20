import { connection } from "next/server";
import { hydrateBolnaCall } from "@/lib/bolna/execution";
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
  if (opts?.hydrateBolna !== false && snap.call && !snap.parent.is_example) {
    const pulled = await hydrateBolnaCall(snap.call);
    if (pulled) {
      snap = (await deskSnapshotByToken(token)) ?? snap;
    }
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
