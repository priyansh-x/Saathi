import { connection } from "next/server";
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
import { defaultLadder } from "@/lib/config";
import { query } from "@/lib/db/client";
import type { Lang } from "@/lib/i18n/messages";
import { istDayKey, istDayOffset, minutesNowIst, parseHhMm } from "@/lib/time";
import { dedupeDoses, todayStatus, type LadderPlan } from "@/lib/today";

export function readLang(value?: string): Lang {
  return value === "hi" ? "hi" : "en";
}

export async function loadFamily(token: string) {
  await connection();
  const parent = await parentByToken(token);
  if (!parent) return null;
  const [contacts, medicines, actAlerts, allAlerts] = await Promise.all([
    contactsFor(parent.id),
    medicinesFor(parent.id),
    openActAlerts(parent.id),
    alertsFor(parent.id),
  ]);
  const day = istDayKey();
  const [call, yesterday, doses, week, planRows] = await Promise.all([
    callOnDay(parent.id, day),
    callOnDay(parent.id, istDayOffset(-1)),
    dosesOnDay(parent.id, day),
    historyDays(parent.id, 7),
    query<LadderPlan>(
      `select retry_10, retry_25, soft_30, last_45, escalate_60 from family_config where parent_id = $1`,
      [parent.id],
    ).catch(() => [] as LadderPlan[]),
  ]);
  const attempts = call ? await attemptsFor(call.id) : [];
  const uniqueDoses = dedupeDoses(doses);
  const escalated = attempts.some((a) => a.result === "escalated");
  return {
    parent,
    contacts,
    medicines,
    actAlerts,
    allAlerts,
    day,
    call,
    yesterday,
    doses: uniqueDoses,
    week,
    attempts,
    plan: planRows[0] ?? defaultLadder(),
    status: todayStatus({
      paused: parent.paused,
      call,
      doses: uniqueDoses,
      actAlerts,
      nowMin: minutesNowIst(),
      callTimeMin: parseHhMm(parent.call_time),
      escalated,
      neverCalled: week.calls.length === 0,
    }),
    child: contacts.find((c) => c.role === "child") ?? null,
    neighbour: contacts.find((c) => c.role === "neighbour") ?? null,
  };
}
