import { connection } from "next/server";
import { callNeedsBolnaHydrate, hydrateBolnaCall } from "@/lib/bolna/execution";
import {
  alertsFor,
  attemptsFor,
  callOnDay,
  contactsFor,
  dosesOnDay,
  historyDays,
  medicinesFor,
  openActAlerts,
  parentByToken,
} from "@/lib/db/queries";
import { defaultLadder, isMockBolna } from "@/lib/config";
import { query } from "@/lib/db/client";
import type { CallRow } from "@/lib/db/types";
import type { Lang } from "@/lib/i18n/messages";
import { istDayKey, istDayOffset, minutesNowIst, parseHhMm } from "@/lib/time";
import { dedupeDoses, todayStatus, type LadderPlan } from "@/lib/today";
import { latestWeeklyNote } from "@/lib/weekly";
import { latestDelivery, latestUndeliveredEmail } from "@/lib/whatsapp/delivery";

export function readLang(value?: string): Lang {
  return value === "hi" ? "hi" : "en";
}

export async function loadFamily(token: string, opts?: { allAlerts?: boolean; hydrateBolna?: boolean }) {
  await connection();
  const parent = await parentByToken(token);
  if (!parent) return null;
  const day = istDayKey();
  const [contacts, medicines, actAlerts, allAlerts, call, yesterday, doses, week, planRows, weekly, delivery, couldntReach] =
    await Promise.all([
      contactsFor(parent.id),
      medicinesFor(parent.id),
      openActAlerts(parent.id),
      opts?.allAlerts === false ? Promise.resolve([]) : alertsFor(parent.id),
      callOnDay(parent.id, day),
      callOnDay(parent.id, istDayOffset(-1)),
      dosesOnDay(parent.id, day),
      historyDays(parent.id, 7),
      query<LadderPlan>(
        `select retry_10, retry_25, soft_30, last_45, escalate_60 from family_config where parent_id = $1`,
        [parent.id],
      ).catch(() => [] as LadderPlan[]),
      latestWeeklyNote(parent.id),
      latestDelivery(parent.id),
      latestUndeliveredEmail(parent.id),
    ]);

  let todayCall: CallRow | null = call;
  if (opts?.hydrateBolna && todayCall && !isMockBolna() && callNeedsBolnaHydrate(todayCall)) {
    const pulled = await hydrateBolnaCall(todayCall);
    if (pulled) todayCall = (await callOnDay(parent.id, day)) ?? todayCall;
  }

  const attempts = todayCall ? await attemptsFor(todayCall.id) : [];
  const uniqueDoses = dedupeDoses(doses);
  const escalated = attempts.some((a) => a.result === "escalated");
  return {
    parent,
    contacts,
    medicines,
    actAlerts,
    allAlerts,
    day,
    call: todayCall,
    yesterday,
    doses: uniqueDoses,
    week,
    attempts,
    plan: planRows[0] ?? defaultLadder(),
    status: todayStatus({
      paused: parent.paused,
      call: todayCall,
      doses: uniqueDoses,
      actAlerts,
      nowMin: minutesNowIst(),
      callTimeMin: parseHhMm(parent.call_time),
      escalated,
      neverCalled: week.calls.length === 0,
    }),
    child: contacts.find((c) => c.role === "child") ?? null,
    neighbour: contacts.find((c) => c.role === "neighbour") ?? null,
    weekly,
    delivery,
    couldntReach,
  };
}
