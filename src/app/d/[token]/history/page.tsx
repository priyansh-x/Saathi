import { Suspense } from "react";
import Link from "next/link";
import { ExpiredLink, FamilyFrame, LoadingState } from "@/components/family/chrome";
import { historyDays, medicinesFor } from "@/lib/db/queries";
import { loadFamily, readLang } from "@/lib/family-load";
import {
  callGlyph,
  callOnDayKey,
  cellAria,
  dayHasAlert,
  historySummary,
  medsOnDay,
  mondayIndex,
  monthLabel,
  moodFromCall,
  qs,
} from "@/lib/history";
import { messages } from "@/lib/i18n/messages";
import { istDayOffset, weekdayShort } from "@/lib/time";

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

async function HistoryBody({ token, lang, days }: { token: string; lang: ReturnType<typeof readLang>; days: 7 | 30 }) {
  const data = await loadFamily(token);
  if (!data) return <ExpiredLink />;
  const hist = await historyDays(data.parent.id, 30);
  const medicines = await medicinesFor(data.parent.id);
  const medicineIds = medicines.map((m) => m.id);
  const t = messages[lang];
  const keys = Array.from({ length: days }, (_, i) => istDayOffset(-(days - 1 - i)));
  const pad = mondayIndex(keys[0]);
  const cells: (string | null)[] = [...Array.from({ length: pad }, () => null), ...keys];
  while (cells.length % 7 !== 0) cells.push(null);
  const weekdays = lang === "hi" ? ["सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि", "रवि"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <FamilyFrame
      token={token}
      lang={lang}
      example={data.parent.is_example}
      alerts={data.actAlerts}
      active="history"
      extraQuery={{ days: String(days) }}
    >
      <p className="text-sm">{historySummary(keys, hist.calls, hist.doses, medicineIds, lang)}</p>

      <div className="mt-4 flex gap-2">
        <Link
          href={qs({ lang, days: "7" })}
          className={`inline-flex h-11 min-h-11 items-center rounded-2xl px-4 ${days === 7 ? "bg-primary text-white" : "border border-border"}`}
        >
          {t.days7}
        </Link>
        <Link
          href={qs({ lang, days: "30" })}
          className={`inline-flex h-11 min-h-11 items-center rounded-2xl px-4 ${days === 30 ? "bg-primary text-white" : "border border-border"}`}
        >
          {t.days30}
        </Link>
      </div>

      {hist.calls.length === 0 ? (
        <p className="mt-8 text-muted-foreground">{t.emptyHistory}</p>
      ) : (
        <>
          <ol className="mt-5 grid grid-cols-7 gap-2 text-center text-[13px] text-muted-foreground">
            {weekdays.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ol>
          <ol className="mt-2 grid grid-cols-7 gap-2">
            {cells.map((day, i) => {
              if (!day) {
                return <li key={`pad-${i}`} aria-hidden className="min-h-16" />;
              }
              const call = callOnDayKey(hist.calls, day);
              const meds = medsOnDay(hist.doses, day, medicineIds);
              const alert = dayHasAlert(hist.alerts, day);
              const short = meds.total > 0 && meds.taken < meds.total;
              const showMonth = day.endsWith("-01") || i === pad;
              const inner = (
                <>
                  {showMonth ? <span className="text-[10px] text-muted-foreground">{monthLabel(day)}</span> : null}
                  <span className="tabular text-[13px]">{Number(day.slice(8))}</span>
                  <span aria-hidden className="text-sm leading-none">
                    {callGlyph(call)}
                  </span>
                  <span className={`text-[11px] ${short ? "text-amber-ink" : "text-muted-foreground"}`}>
                    {meds.taken}/{meds.total}
                  </span>
                  {alert ? <span aria-hidden className="mt-0.5 size-1.5 rounded-full bg-alert" /> : null}
                </>
              );
              const cls =
                "flex min-h-16 flex-col items-center justify-center rounded-xl border border-border bg-card px-0.5 py-1 text-center";
              return (
                <li key={day}>
                  {call ? (
                    <Link
                      href={`/d/${token}/calls/${call.id}${qs({ lang, from: "history", days: String(days) })}`}
                      aria-label={cellAria(day, call, meds, lang)}
                      className={cls}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <span aria-label={cellAria(day, null, meds, lang)} className={`${cls} border-dashed text-muted-foreground`}>
                      {inner}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
          <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
            <li>✓ {t.legendAnswered} · ✕ {t.legendMissed} · – {t.legendSkipped}</li>
            <li>
              2/2 {t.legendMeds}
              {lang === "en" ? " (amber when short)" : " (कम हो तो गहरा)"}
            </li>
            <li>
              <span className="mr-1 inline-block size-1.5 rounded-full bg-alert align-middle" />
              {t.legendAlert}
            </li>
          </ul>
        </>
      )}

      <p className="mt-6 text-sm text-muted-foreground">{t.moodCaption}</p>
      <ul className="mt-3 space-y-2">
        {(
          [
            ["cheerful", t.moodCheerful],
            ["okay", t.moodOkay],
            ["low", t.moodLow],
          ] as const
        ).map(([key, label]) => (
          <li key={key} className="flex items-center gap-2 text-sm">
            <span className="w-20">{label}</span>
            <span className="flex flex-wrap gap-1">
              {keys.map((day) => {
                const mood = moodFromCall(callOnDayKey(hist.calls, day));
                const filled = mood === key;
                return (
                  <span
                    key={`${key}-${day}`}
                    aria-label={`${weekdayShort(day, lang)} ${label}`}
                    className={`size-2.5 rounded-full ${filled ? "bg-foreground" : "border border-foreground/40"}`}
                  />
                );
              })}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-muted-foreground">{t.moodUnclear}: ○</p>
    </FamilyFrame>
  );
}

