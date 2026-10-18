import Link from "next/link";
import { EmptyState, ExpiredLink, FamilyFrame, PageTitle } from "@/components/family/chrome";
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
  return <HistoryBody token={token} lang={lang} days={sp.days === "7" ? 7 : 30} />;
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
      addressTerm={data.parent.address_term}
    >
      <PageTitle sub={historySummary(keys, hist.calls, hist.doses, medicineIds, lang)}>{t.history}</PageTitle>

      <div className="seg mt-4 grid w-full grid-cols-2">
        <Link href={qs({ lang, days: "7" })} aria-current={days === 7 ? "page" : undefined} className="w-full">
          {t.days7}
        </Link>
        <Link href={qs({ lang, days: "30" })} aria-current={days === 30 ? "page" : undefined} className="w-full">
          {t.days30}
        </Link>
      </div>

      {hist.calls.length === 0 ? (
        <EmptyState title={t.emptyHistory} />
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
