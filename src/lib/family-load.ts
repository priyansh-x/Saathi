import { connection } from "next/server";
import {
  alertsFor,
  callOnDay,
  contactsFor,
  dosesOnDay,
  medicinesFor,
  openActAlerts,
  parentByToken,
  todayStatus,
} from "@/lib/db/queries";
import type { Lang } from "@/lib/i18n/messages";
import { istDayKey } from "@/lib/time";

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
  const call = await callOnDay(parent.id, day);
  const doses = await dosesOnDay(parent.id, day);
  return {
    parent,
    contacts,
    medicines,
    actAlerts,
    allAlerts,
    day,
    call,
    doses,
    status: todayStatus({ call, doses, actAlerts }),
    child: contacts.find((c) => c.role === "child") ?? null,
    neighbour: contacts.find((c) => c.role === "neighbour") ?? null,
  };
}
