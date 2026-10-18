import Link from "next/link";
import { AlertTriangle, Check, Clock, Pause } from "lucide-react";
import { ExpiredLink, FamilyFrame } from "@/components/family/chrome";
import { setPaused } from "@/lib/db/queries";
import { loadFamily, readLang } from "@/lib/family-load";
import { messages, pickLocale } from "@/lib/i18n/messages";
import { redirect } from "next/navigation";
import { resolveAlert } from "@/lib/db/queries";
import {
  doseMark,
  heroCopy,
  humanQuote,
  reachSteps,
  slotLabel,
  type DayState,
} from "@/lib/today";
import { weekdayShort } from "@/lib/time";
import { weeklyDeskCopy } from "@/lib/weekly";
import { neighbourOptedIn } from "@/lib/neighbour";
import { statusClasses } from "@/lib/status";

export default async function TodayPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { token } = await params;
  const lang = readLang((await searchParams).lang);
  const data = await loadFamily(token);
  if (!data) return <ExpiredLink lang={lang} />;
  const t = messages[lang];
  const tel = data.parent.phone.replace(/\s/g, "");
  const neighbourTel = data.neighbour?.phone.replace(/\s/g, "") ?? "";
  const state = data.status as DayState;
  const alert = data.actAlerts[0] ?? null;
  const copy = heroCopy({
    state,
    lang,
    callTime: data.parent.call_time,
    call: data.call,
    doses: data.doses,
    alert,
    attempts: data.attempts,
    neighbourName: data.neighbour?.first_name || "Sunita",
    ackedBy: alert?.acked_by ?? null,
    ackedAt: alert?.acked_at ?? null,
  });
  const steps = reachSteps({ attempts: data.attempts, plan: data.plan, callTime: data.parent.call_time });
  const quote = data.call?.mood_quote;
  const quoteInHero = Boolean(humanQuote(alert) && state === "act");
  const showQuote = quote && !quoteInHero;
  const weekDays = data.week.calls;
  const parentId = data.parent.id;
  const childName = data.child?.first_name || "family";
  const updatedAt = alert?.created_at || data.call?.ended_at || data.call?.started_at;
  const neighbourReady = data.neighbour ? await neighbourOptedIn(data.parent.id) : true;

  async function resume() {
    "use server";
    await setPaused(parentId, false);
    redirect(`/d/${token}?lang=${lang}`);
  }

  async function markOk() {
    "use server";
    if (alert) await resolveAlert(alert.id, childName);
    redirect(`/d/${token}?lang=${lang}`);
  }

  const Icon = state === "paused" ? Pause : state === "scheduled" || state === "skipped" ? Clock : state === "good" ? Check : state === "act" ? AlertTriangle : AlertTriangle;

  return (
    <FamilyFrame
      token={token}
      lang={lang}
      example={data.parent.is_example}
      alerts={data.actAlerts}
      active="today"
      updatedAt={updatedAt}
    >
      <section className={`rounded-2xl px-4 py-4 ${statusClasses(state)}`}>
        <p className="flex items-center gap-2 text-sm font-medium">
          <Icon className="size-4" aria-hidden />
          <span>{copy.chip}</span>
        </p>
        <h1 className="mt-2 text-xl font-semibold leading-snug">
          {copy.headline}
        </h1>
        {copy.sub ? <p className="mt-2 text-sm opacity-90">{copy.sub}</p> : null}
        {data.neighbour && !neighbourReady ? (
          <p className="mt-2 text-sm">{t.waitingNeighbour}</p>
        ) : null}

        {state === "trying" ? (
          <ol className="mt-3 space-y-1.5 text-sm">
            {steps.map((step) => {
              const mark = step.done ? (step.ok ? "✓" : "✕") : "";
              const label =
                step.kind === "neighbour"
                  ? t.askNeighbourCheck
                  : step.kind === "next"
                    ? t.nextTry
                    : step.atMin === 0
                      ? t.calledNoAnswer
                      : t.calledAgain;
              return (
                <li
                  key={step.atMin}
                  className={`tabular ${step.current ? "font-semibold" : step.done ? "" : "opacity-60"}`}
                >
                  {step.clock} {label} {mark}
                </li>
              );
            })}
          </ol>
        ) : null}

        <div className="mt-4 space-y-2">
          {state === "act" ? (
            <Link
              href={`/d/${token}/alerts/${alert?.id}?lang=${lang}&from=today`}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base text-white"
            >
              {t.openAlert}
            </Link>
          ) : state === "paused" ? (
            <form action={resume}>
              <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base text-white">
                {t.resumeCalls}
              </button>
            </form>
          ) : state === "scheduled" ? null : (
            <a
              href={`tel:${tel}`}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base text-white"
            >
              {t.callMaa}
            </a>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {state === "scheduled" && data.yesterday ? (
              <Link href={`/d/${token}/calls/${data.yesterday.id}?lang=${lang}&from=today`} className="underline-offset-2 hover:underline">
                {t.seeYesterday}
              </Link>
            ) : null}
            {state === "good" || state === "look" ? (
              data.call ? (
                <Link href={`/d/${token}/calls/${data.call.id}?lang=${lang}&from=today`} className="underline-offset-2 hover:underline">
                  {t.seeTodaysCall}
                </Link>
              ) : null
            ) : null}
            {state === "trying" ? (
              <>
                <form action={markOk}>
                  <button type="submit" className="underline-offset-2 hover:underline">
                    {t.shesOk}
                  </button>
                </form>
                {neighbourTel ? (
                  <a href={`tel:${neighbourTel}`} className="underline-offset-2 hover:underline">
                    {t.askNeighbourNow}
                  </a>
                ) : null}
              </>
            ) : null}
            {state === "act" ? (
              <a href={`tel:${tel}`} className="underline-offset-2 hover:underline">
                {t.callMaa}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {state === "scheduled" && data.yesterday ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {pickLocale(lang, data.yesterday.summary_en, data.yesterday.summary_hi)}
        </p>
      ) : null}

      <ul className="mt-5 space-y-3">
        {data.doses.length > 0 ? (
          <li className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="text-sm text-muted-foreground">{t.medicinesToday}</p>
            <ul className="mt-2 space-y-2">
              {data.doses.map((dose) => (
                <li key={`${dose.medicine_id}-${dose.meal}`} className="flex items-baseline justify-between gap-3">
                  <span>
                    {dose.name}{" "}
                    <span className="text-sm text-muted-foreground">{slotLabel(dose.meal, lang)}</span>
                  </span>
                  <span className="text-sm">{doseMark(dose.status, lang)}</span>
                </li>
              ))}
            </ul>
          </li>
        ) : null}

        {showQuote ? (
          <li className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="text-sm text-muted-foreground">{t.inHerWords}</p>
            <p className="font-devanagari mt-1 text-lg leading-[1.6]">“{quote}”</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.fromTodaysCall}. {t.moodCaption}
            </p>
          </li>
        ) : null}

        {data.weekly.built ? (
          <li className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="text-sm text-muted-foreground">{t.weeklyNote}</p>
            <p className="mt-1 text-sm leading-relaxed">{weeklyDeskCopy(data.weekly.built, lang)}</p>
            <Link href={`/d/${token}/history?lang=${lang}&days=7`} className="mt-2 inline-block text-sm underline-offset-2 hover:underline">
              {t.weeklySeeHistory}
            </Link>
          </li>
        ) : null}

        <li className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">{t.thisWeek}</p>
          <ol className="mt-3 grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: 7 }, (_, i) => {
              const offset = i - 6;
              const dayKey = data.day;
              const [y, m, d] = dayKey.split("-").map(Number);
              const dt = new Date(y, m - 1, d + offset);
              const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
              const call = weekDays.find((c) => c.started_at.startsWith(key));
              const word = call?.status === "completed" ? t.legendAnswered : call?.status === "missed" ? t.legendMissed : "–";
              return (
                <li key={key}>
                  <Link href={`/d/${token}/history?lang=${lang}&days=7`} className="flex min-h-14 flex-col items-center justify-center rounded-lg text-xs">
                    <span className="text-muted-foreground">{weekdayShort(key, lang)}</span>
                    <span className="mt-1 font-medium">{word}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </li>
      </ul>
    </FamilyFrame>
  );
}
