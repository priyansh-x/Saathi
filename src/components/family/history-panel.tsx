import Link from "next/link";
import { EmptyState, PageTitle } from "@/components/family/chrome";
import { historyDays, medicinesFor } from "@/lib/db/queries";
import type { FamilyDesk } from "@/lib/family-load";
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

export async function HistoryPanel({
  token,
  lang,
  data,
  days,
}: {
  token: string;
  lang: Lang;
  data: FamilyDesk;
  days: 7 | 30;
}) {
  const hist = await historyDays(data.parent.id, 40);
  const medicines = await medicinesFor(data.parent.id);
  const medicineIds = medicines.map((m) => m.id);
  const t = messages[lang];
  const keys = Array.from({ length: days }, (_, i) => istDayOffset(-(days - 1 - i))).reverse();

  return (
    <>
      <PageTitle sub={historySummary(keys, hist.calls, hist.doses, medicineIds, lang)}>{t.history}</PageTitle>

      <div className="seg mt-4 grid w-full grid-cols-2">
        <Link
          href={`/d/${token}/history${qs({ lang, days: "7" })}`}
          aria-current={days === 7 ? "page" : undefined}
          className="w-full"
        >
          {t.days7}
        </Link>
        <Link
          href={`/d/${token}/history${qs({ lang, days: "30" })}`}
          aria-current={days === 30 ? "page" : undefined}
          className="w-full"
        >
          {t.days30}
        </Link>
      </div>

      {hist.calls.length === 0 ? (
        <EmptyState title={t.emptyHistory} body={t.emptyHistoryBody} />
      ) : (
        <ol className="list-group mt-2">
          {keys.map((day) => {
            const call = callOnDayKey(hist.calls, day);
            const meds = medsOnDay(hist.doses, day, medicineIds);
            const mood = moodFromCall(call);
            const alert = dayHasAlert(hist.alerts, day);
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
