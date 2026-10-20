"use client";

import Link from "next/link";
import { useState } from "react";
import { EmptyState, PageTitle } from "@/components/family/chrome";
import type { AlertRow, CallRow, DoseLog } from "@/lib/db/types";
import {
  callOnDayKey,
  dayCallLabel,
  dayHasAlert,
  dayMedsLabel,
  historySummary,
  medsOnDay,
  moodFromCall,
  moodLabel,
  qs,
} from "@/lib/history";
import { messages, type Lang } from "@/lib/i18n/messages";
import { MONTH_EN, istDayOffset, parseIstParts, weekdayShort } from "@/lib/time";

function dayTitle(day: string, lang: Lang) {
  const { d, mo } = parseIstParts(`${day}T12:00:00+05:30`);
  return `${weekdayShort(day, lang)} ${d} ${MONTH_EN[mo - 1]}`;
}

export function HistoryView({
  token,
  lang,
  initialDays,
  calls,
  doses,
  alerts,
  medicineIds,
}: {
  token: string;
  lang: Lang;
  initialDays: 7 | 30;
  calls: CallRow[];
  doses: DoseLog[];
  alerts: AlertRow[];
  medicineIds: string[];
}) {
  const [days, setDays] = useState<7 | 30>(initialDays);
  const t = messages[lang];
  const keys = Array.from({ length: days }, (_, i) => istDayOffset(-(days - 1 - i))).reverse();

  function pick(next: 7 | 30) {
    setDays(next);
    window.history.replaceState(null, "", `/d/${token}/history${qs({ lang, days: next === 7 ? "7" : "30" })}`);
  }

  return (
    <>
      <PageTitle sub={historySummary(keys, calls, doses, medicineIds, lang)}>{t.history}</PageTitle>

      <div className="seg mt-4 grid w-full grid-cols-2">
        <button type="button" aria-current={days === 7 ? "page" : undefined} className="w-full" onClick={() => pick(7)}>
          {t.days7}
        </button>
        <button type="button" aria-current={days === 30 ? "page" : undefined} className="w-full" onClick={() => pick(30)}>
          {t.days30}
        </button>
      </div>

      {calls.length === 0 ? (
        <EmptyState title={t.emptyHistory} body={t.emptyHistoryBody} />
      ) : (
        <ol className="list-group mt-2">
          {keys.map((day) => {
            const call = callOnDayKey(calls, day);
            const meds = medsOnDay(doses, day, medicineIds);
            const mood = moodFromCall(call);
            const alert = dayHasAlert(alerts, day);
            const body = (
              <>
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{dayTitle(day, lang)}</span>
                  <span className={`text-xs ${alert ? "text-alert" : "invisible"}`}>{t.legendAlert}</span>
                </span>
                <span className="mt-1 block truncate text-sm text-muted-foreground">
                  {dayCallLabel(call, lang)} · {dayMedsLabel(meds, lang)}
                </span>
                <span className="mt-0.5 block h-5 truncate text-sm text-muted-foreground">
                  {call?.status === "completed" ? moodLabel(mood, lang) : "\u00a0"}
                </span>
              </>
            );
            return (
              <li key={day}>
                {call ? (
                  <Link
                    href={`/d/${token}/calls/${call.id}${qs({ lang, from: "history", days: String(days) })}`}
                    className="flex min-h-[92px] flex-col justify-center px-4 py-3"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="flex min-h-[92px] flex-col justify-center px-4 py-3 text-muted-foreground">{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <p className="mt-4 text-sm text-muted-foreground">{t.moodCaption}</p>
    </>
  );
}
