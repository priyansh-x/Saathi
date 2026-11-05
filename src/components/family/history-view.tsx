"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, List } from "lucide-react";
import { EmptyState, PageTitle } from "@/components/family/chrome";
import type { AlertRow, CallRow, DoseLog } from "@/lib/db/types";
import {
  callsOnDay,
  cellAria,
  dayAlerts,
  dayCallLabel,
  dayMedsLabel,
  dayStatus,
  monthGrid,
  monthKeyOf,
  monthLabel,
  monthStats,
  monthTitle,
  medsOnDay,
  moodFromCall,
  moodLabel,
  qs,
  shiftMonth,
  weekdayInitials,
  type DayStatus,
} from "@/lib/history";
import { messages, type Lang } from "@/lib/i18n/messages";
import { formatClock, istDayKey, parseIstParts, weekdayShort } from "@/lib/time";

export type HistoryMode = "calendar" | "list";

function dayTitle(day: string, lang: Lang) {
  const { d } = parseIstParts(`${day}T12:00:00+05:30`);
  return `${weekdayShort(day, lang)} ${d} ${monthLabel(day, lang)}`;
}

const CELL_TONE: Record<DayStatus, string> = {
  answered: "bg-good-soft text-good",
  missed: "bg-alert-soft text-alert",
  skipped: "bg-amber-soft text-amber-ink",
  none: "text-muted-foreground",
};

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-control)] bg-sunk px-3 py-2.5">
      <p className="text-[20px] leading-tight font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{label}</p>
    </div>
  );
}

function CallLinks({
  token,
  lang,
  mode,
  day,
  calls,
  doses,
  alerts,
  medicineIds,
}: {
  token: string;
  lang: Lang;
  mode: HistoryMode;
  day: string;
  calls: CallRow[];
  doses: DoseLog[];
  alerts: AlertRow[];
  medicineIds: string[];
}) {
  const t = messages[lang];
  const dayCalls = callsOnDay(calls, day);
  const meds = medsOnDay(doses, day, medicineIds);
  const alertCount = dayAlerts(alerts, calls, day).length;
  if (dayCalls.length === 0) {
    return (
      <div className="px-4 py-3.5">
        <p className="font-medium">{dayTitle(day, lang)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.dayNoCalls} · {dayMedsLabel(meds, lang)}
        </p>
      </div>
    );
  }
  return (
    <>
      {dayCalls.map((call, index) => {
        const { hh, mm } = parseIstParts(call.started_at);
        const status = dayStatus([call]);
        return (
          <Link
            key={call.id}
            href={`/d/${token}/calls/${encodeURIComponent(String(call.id))}${qs({ lang, from: "history", view: mode === "list" ? "list" : undefined })}`}
            className="flex min-h-[64px] items-center gap-3 px-4 py-3"
          >
            <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${status === "answered" ? "bg-good" : status === "missed" ? "bg-alert" : "bg-ink-3"}`} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-3">
                <span className="font-medium">{dayTitle(day, lang)}</span>
                {index === 0 && alertCount ? <span className="pill shrink-0 bg-alert-soft !px-2 !py-0.5 text-xs text-alert">{t.legendAlert}</span> : null}
              </span>
              <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                {formatClock(hh, mm, lang)} · {dayCallLabel(call, lang)}
                {call.status === "completed" ? ` · ${moodLabel(moodFromCall(call), lang)}` : ""}
              </span>
              <span className="block truncate text-sm text-muted-foreground">{dayMedsLabel(meds, lang)}</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-ink-3" aria-hidden />
          </Link>
        );
      })}
    </>
  );
}

export function HistoryView({
  token,
  lang,
  initialMode,
  calls,
  doses,
  alerts,
  medicineIds,
}: {
  token: string;
  lang: Lang;
  initialMode: HistoryMode;
  calls: CallRow[];
  doses: DoseLog[];
  alerts: AlertRow[];
  medicineIds: string[];
}) {
  const t = messages[lang];
  const today = istDayKey();
  const firstDay = useMemo(
    () => calls.reduce((min, c) => (c.started_at.slice(0, 10) < min ? c.started_at.slice(0, 10) : min), today),
    [calls, today],
  );
  const latestCallDay = calls.length ? calls.reduce((max, c) => (c.started_at > max ? c.started_at : max), "").slice(0, 10) : today;

  const [mode, setMode] = useState<HistoryMode>(initialMode);
  const [month, setMonth] = useState(monthKeyOf(today));
  const [selected, setSelected] = useState(latestCallDay);

  const firstMonth = monthKeyOf(firstDay);
  const thisMonth = monthKeyOf(today);
  const stats = monthStats(month, today, firstDay, calls, doses, alerts, medicineIds);
  const cells = monthGrid(month);
  const listDays = cells.filter((d): d is string => !!d && d <= today && d >= firstDay).reverse();

  function pickMode(next: HistoryMode) {
    setMode(next);
    window.history.replaceState(null, "", `/d/${token}/history${qs({ lang, view: next === "list" ? "list" : undefined })}`);
  }

  function go(delta: number) {
    const next = shiftMonth(month, delta);
    setMonth(next);
    const keep = monthKeyOf(selected) === next;
    if (!keep) {
      const days = monthGrid(next).filter((d): d is string => !!d && d <= today && d >= firstDay);
      const withCall = [...days].reverse().find((d) => callsOnDay(calls, d).length);
      setSelected(withCall ?? days[days.length - 1] ?? selected);
    }
  }

  const medPct = stats.expected ? Math.round((stats.taken / stats.expected) * 100) : null;

  return (
    <>
      <PageTitle>{t.history}</PageTitle>

      {calls.length === 0 ? (
        <EmptyState title={t.emptyHistory} body={t.emptyHistoryBody} />
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full border border-border bg-card disabled:opacity-35"
              aria-label={t.prevMonth}
              disabled={month <= firstMonth}
              onClick={() => go(-1)}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <h2 className="flex-1 text-center text-[17px] font-semibold" aria-live="polite">
              {monthTitle(month, lang)}
            </h2>
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full border border-border bg-card disabled:opacity-35"
              aria-label={t.nextMonth}
              disabled={month >= thisMonth}
              onClick={() => go(1)}
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Stat value={`${stats.answered}/${stats.placed}`} label={t.statCalls} />
            <Stat value={medPct == null ? "–" : `${medPct}%`} label={t.statMeds} />
            <Stat value={String(stats.alertDays)} label={t.statAlertDays} />
          </div>

          <div className="seg mt-4 grid w-full grid-cols-2">
            <button type="button" aria-current={mode === "calendar" ? "page" : undefined} className="w-full gap-2" onClick={() => pickMode("calendar")}>
              <CalendarDays className="size-4" aria-hidden />
              {t.historyCalendar}
            </button>
            <button type="button" aria-current={mode === "list" ? "page" : undefined} className="w-full gap-2" onClick={() => pickMode("list")}>
              <List className="size-4" aria-hidden />
              {t.historyList}
            </button>
          </div>

          {mode === "calendar" ? (
            <>
              <div className="card mt-3 p-3">
                <div className="grid grid-cols-7 gap-1 pb-1 text-center text-xs font-medium text-ink-3" aria-hidden>
                  {weekdayInitials(lang).map((w, i) => (
                    <span key={i}>{w}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((day, i) => {
                    if (!day) return <span key={`pad-${i}`} />;
                    const { d } = parseIstParts(`${day}T12:00:00+05:30`);
                    const future = day > today;
                    const before = day < firstDay;
                    const dayCalls = callsOnDay(calls, day);
                    const status = dayStatus(dayCalls);
                    const meds = medsOnDay(doses, day, medicineIds);
                    const hasAlert = dayAlerts(alerts, calls, day).length > 0;
                    const isSel = day === selected;
                    const isToday = day === today;
                    const tone = future || before ? "text-ink-3 opacity-50" : CELL_TONE[status];
                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={future || before}
                        aria-pressed={isSel}
                        aria-label={`${cellAria(day, dayCalls[0] ?? null, meds, lang)}${hasAlert ? `, ${t.legendAlert}` : ""}`}
                        onClick={() => setSelected(day)}
                        className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-[15px] font-medium tabular-nums transition-[box-shadow,transform] active:scale-95 ${tone} ${
                          isSel ? "ring-2 ring-foreground" : isToday ? "ring-1 ring-brand" : ""
                        }`}
                      >
                        {d}
                        {!future && !before && meds.total > 0 ? (
                          <span aria-hidden className="absolute bottom-1.5 flex gap-0.5">
                            {Array.from({ length: Math.min(meds.total, 4) }, (_, k) => (
                              <span key={k} className={`size-1 rounded-full ${k < meds.taken ? "bg-current" : "bg-current opacity-25"}`} />
                            ))}
                          </span>
                        ) : null}
                        {hasAlert && !future ? (
                          <span aria-hidden className="absolute top-1 right-1 size-2 rounded-full bg-alert ring-2 ring-card" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border px-1 pt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-good-soft ring-1 ring-good/40" />{t.legendAnswered}</span>
                  <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-alert-soft ring-1 ring-alert/40" />{t.legendMissed}</span>
                  <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm ring-1 ring-border" />{t.legendNoCall}</span>
                  <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-alert" />{t.legendAlert}</span>
                  <span className="inline-flex items-center gap-1.5"><span className="flex gap-0.5"><span className="size-1 rounded-full bg-foreground" /><span className="size-1 rounded-full bg-foreground opacity-25" /></span>{t.legendMeds}</span>
                </div>
              </div>

              <div className="list-group mt-3">
                <CallLinks token={token} lang={lang} mode={mode} day={selected} calls={calls} doses={doses} alerts={alerts} medicineIds={medicineIds} />
              </div>
            </>
          ) : (
            <ol className="list-group mt-3">
              {listDays.map((day) => (
                <li key={day} className="divide-y divide-border">
                  <CallLinks token={token} lang={lang} mode={mode} day={day} calls={calls} doses={doses} alerts={alerts} medicineIds={medicineIds} />
                </li>
              ))}
            </ol>
          )}
        </>
      )}
      <p className="mt-4 px-1 text-sm text-muted-foreground">{t.moodCaption}</p>
    </>
  );
}
