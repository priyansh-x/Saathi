import { Suspense } from "react";
import Link from "next/link";
import { ExpiredLink, FamilyFrame, LoadingState } from "@/components/family/chrome";
import { historyDays, medicinesFor } from "@/lib/db/queries";
import { loadFamily, readLang } from "@/lib/family-load";
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
import { messages } from "@/lib/i18n/messages";
import { MONTH_EN, istDayOffset, parseIstParts, weekdayShort } from "@/lib/time";

export default async function HistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string; days?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const lang = readLang(sp.lang);
  return (
    <Suspense fallback={<LoadingState lang={lang} />}>
      <HistoryBody token={token} lang={lang} days={sp.days === "7" ? 7 : 30} />
    </Suspense>
  );
}

function dayTitle(day: string, lang: ReturnType<typeof readLang>) {
  const { d, mo } = parseIstParts(`${day}T12:00:00+05:30`);
  return `${weekdayShort(day, lang)} ${d} ${MONTH_EN[mo - 1]}`;
}

async function HistoryBody({ token, lang, days }: { token: string; lang: ReturnType<typeof readLang>; days: 7 | 30 }) {
  const data = await loadFamily(token);
  if (!data) return <ExpiredLink />;
  const hist = await historyDays(data.parent.id, 40);
  const medicines = await medicinesFor(data.parent.id);
  const medicineIds = medicines.map((m) => m.id);
  const t = messages[lang];
  const keys = Array.from({ length: days }, (_, i) => istDayOffset(-(days - 1 - i))).reverse();

  return (
    <FamilyFrame
      token={token}
      lang={lang}
      example={data.parent.is_example}
      alerts={data.actAlerts}
      active="history"
      extraQuery={{ days: String(days) }}
    >
      <h1 className="text-xl font-semibold">{t.history}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{historySummary(keys, hist.calls, hist.doses, medicineIds, lang)}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1">
        <Link
          href={qs({ lang, days: "7" })}
          className={`inline-flex h-11 items-center justify-center rounded-xl text-sm ${days === 7 ? "bg-card font-medium shadow-sm" : "text-muted-foreground"}`}
        >
          {t.days7}
        </Link>
        <Link
          href={qs({ lang, days: "30" })}
          className={`inline-flex h-11 items-center justify-center rounded-xl text-sm ${days === 30 ? "bg-card font-medium shadow-sm" : "text-muted-foreground"}`}
        >
          {t.days30}
        </Link>
      </div>

      {hist.calls.length === 0 ? (
        <p className="mt-8 text-muted-foreground">{t.emptyHistory}</p>
      ) : (
        <ol className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {keys.map((day) => {
            const call = callOnDayKey(hist.calls, day);
            const meds = medsOnDay(hist.doses, day, medicineIds);
            const mood = moodFromCall(call);
            const alert = dayHasAlert(hist.alerts, day);
            const body = (
              <>
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{dayTitle(day, lang)}</span>
                  {alert ? <span className="text-xs text-alert">{t.legendAlert}</span> : null}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {dayCallLabel(call, lang)} · {dayMedsLabel(meds, lang)}
                </span>
                {call?.status === "completed" ? (
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {moodLabel(mood, lang)}
                  </span>
                ) : null}
              </>
            );
            return (
              <li key={day}>
                {call ? (
                  <Link
                    href={`/d/${token}/calls/${call.id}${qs({ lang, from: "history", days: String(days) })}`}
                    className="block px-4 py-3"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="px-4 py-3 text-muted-foreground">{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <p className="mt-4 text-sm text-muted-foreground">{t.moodCaption}</p>
    </FamilyFrame>
  );
}
