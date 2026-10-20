import type { CSSProperties } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  Clock,
  Eye,
  HeartHandshake,
  Minus,
  Pause,
  Phone,
  Quote,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { IconMedicine } from "@/components/icons";
import { redirect } from "next/navigation";
import { placeMorningCall } from "@/lib/bolna/place";
import { resolveAlert, setPaused } from "@/lib/db/queries";
import type { DoseLog } from "@/lib/db/types";
import type { FamilyDesk } from "@/lib/family-load";
import { greeting, messages, personal, pickLocale, type Lang } from "@/lib/i18n/messages";
import { neighbourOptedIn } from "@/lib/neighbour";
import { heroCopy, humanQuote, reachSteps, ringCopy, slotLabel, statusTone, type DayState } from "@/lib/today";
import { weekdayShort } from "@/lib/time";
import { weeklyDeskCopy } from "@/lib/weekly";

const HERO_TONE = {
  good: "bg-good-soft text-good",
  look: "bg-amber-soft text-amber-ink",
  act: "bg-alert-soft text-alert",
  neutral: "bg-card text-foreground",
} as const;

const HERO_ICON_BG = {
  good: "bg-good text-white",
  look: "bg-amber-line text-white",
  act: "bg-alert text-white",
  neutral: "bg-brand-soft text-brand-deep",
} as const;

function DosePill({ status, lang }: { status: DoseLog["status"]; lang: Lang }) {
  const t = messages[lang];
  if (status === "taken") {
    return (
      <span className="pill bg-good-soft text-good">
        <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
        {t.taken}
      </span>
    );
  }
  if (status === "not_taken") {
    return (
      <span className="pill bg-amber-soft text-amber-ink">
        <X className="size-3.5" strokeWidth={2.5} aria-hidden />
        {t.notTaken}
      </span>
    );
  }
  if (status === "not_sure") {
    return <span className="pill bg-sunk text-muted-foreground">{t.notSure}</span>;
  }
  return <span className="pill bg-sunk text-ink-3">{t.notAsked}</span>;
}

export async function TodayPanel({
  token,
  lang,
  data,
  callParam,
}: {
  token: string;
  lang: Lang;
  data: FamilyDesk;
  callParam?: string;
}) {
  const t = messages[lang];
  const term = data.parent.address_term || t.maa;
  const p = (s: string) => personal(s, term, lang);
  const tel = data.parent.phone.replace(/\s/g, "");
  const neighbourTel = data.neighbour?.phone.replace(/\s/g, "") ?? "";
  const state = data.status as DayState;
  const tone = statusTone(state);
  const alert = data.actAlerts[0] ?? null;
  const ringNote = ringCopy(callParam, lang);
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
  const heroQuote = state === "act" ? humanQuote(alert) : null;
  const showQuote = quote && !heroQuote;
  const weekDays = data.week.calls;
  const parentId = data.parent.id;
  const isExample = data.parent.is_example;
  const childName = data.child?.first_name || "family";
  const firstRun = state === "scheduled" && !data.call && weekDays.length === 0;
  const neighbourName = data.neighbour?.first_name;
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

  async function ringNow() {
    "use server";
    if (isExample) {
      redirect(`/d/${token}?lang=${lang}`);
      return;
    }
    const placed = await placeMorningCall(parentId);
    redirect(`/d/${token}?lang=${lang}&call=${placed.ok ? "placed" : placed.reason}`);
  }

  const Icon =
    state === "paused"
      ? Pause
      : state === "scheduled" || state === "skipped"
        ? Clock
        : state === "good"
          ? Check
          : state === "look"
            ? Eye
            : state === "act"
              ? AlertTriangle
              : Clock;

  return (
    <>
      <p className="px-1 pt-2 text-[15px] text-muted-foreground">
        {greeting(lang)}
        {data.child?.first_name ? `, ${data.child.first_name}` : ""}
      </p>

      <section
        className={`grain mt-3 overflow-hidden rounded-[28px] border border-black/[0.04] p-5 shadow-[var(--shadow-card)] ${HERO_TONE[tone]}`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`grid size-9 shrink-0 place-items-center rounded-full ${HERO_ICON_BG[tone]} ${state === "act" || state === "trying" ? "ring-pulse" : ""}`}>
            <Icon className="size-[18px]" strokeWidth={2.4} aria-hidden />
          </span>
          <span className="min-w-0 text-[15px] font-semibold break-words">{copy.chip}</span>
        </div>

        <h1 className="mt-4 text-[26px] leading-[1.15] font-semibold tracking-tight break-words text-foreground">{p(copy.headline)}</h1>
        {heroQuote ? (
          <p className="font-devanagari mt-3 text-[19px] leading-[1.5] text-foreground">
            <span className="serif-line text-2xl text-alert">“</span>
            {heroQuote}
            <span className="serif-line text-2xl text-alert">”</span>
          </p>
        ) : null}
        {copy.sub ? <p className="mt-2 text-[15px] text-foreground/75">{p(copy.sub)}</p> : null}
        {data.couldntReach ? (
          <p className="mt-2 text-[15px] font-medium text-alert">
            {t.couldntReach.replace("{name}", data.couldntReach.name)}
          </p>
        ) : data.delivery ? (
          <p className="mt-2 text-[15px] text-foreground/75">
            {t.deliveredTo.replace("{name}", data.delivery.name).replace("{time}", data.delivery.clock)}
          </p>
        ) : null}
        {data.neighbour && !neighbourReady ? <p className="mt-2 text-[15px] font-medium">{t.waitingNeighbour}</p> : null}
        {ringNote ? <p className="mt-2 text-[15px] font-medium">{ringNote}</p> : null}

        {state === "trying" ? (
          <ol className="mt-4 space-y-0">
            {steps.map((step, i) => {
              const label =
                step.kind === "neighbour"
                  ? p(t.askNeighbourCheck).replace("Sunita", neighbourName || "Sunita")
                  : step.kind === "next"
                    ? t.nextTry
                    : step.atMin === 0
                      ? t.calledNoAnswer
                      : t.calledAgain;
              return (
                <li key={step.atMin} className="relative flex items-center gap-3 py-1.5">
                  {i < steps.length - 1 ? (
                    <span aria-hidden className="absolute top-7 left-[11px] h-full w-px bg-current opacity-20" />
                  ) : null}
                  <span
                    className={`relative z-10 grid size-6 place-items-center rounded-full ${
                      step.done ? "bg-current" : step.current ? "border-2 border-current bg-white" : "border border-current/30 bg-white/60"
                    }`}
                  >
                    {step.done ? (
                      step.ok ? (
                        <Check className="size-3.5 text-white" strokeWidth={3} aria-hidden />
                      ) : (
                        <X className="size-3.5 text-white" strokeWidth={3} aria-hidden />
                      )
                    ) : null}
                  </span>
                  <span className={`tabular text-[15px] ${step.current ? "font-semibold text-foreground" : step.done ? "text-foreground/80" : "text-foreground/55"}`}>
                    {step.clock} · {label}
                  </span>
                </li>
              );
            })}
          </ol>
        ) : null}

        <div className="mt-5 space-y-3">
          {state === "act" ? (
            <Link href={`/d/${token}/alerts/${alert?.id}?lang=${lang}&from=today`} className="btn-primary">
              {t.openAlert}
            </Link>
          ) : state === "paused" ? (
            <form action={resume}>
              <button type="submit" className="btn-primary">
                {t.resumeCalls}
              </button>
            </form>
          ) : state === "trying" ? (
            <a href={`tel:${tel}`} className="btn-primary">
              <Phone className="size-[18px]" aria-hidden />
              {p(t.callMaa)}
            </a>
          ) : !isExample && (state === "scheduled" || state === "skipped") ? (
            <form action={ringNow}>
              <button type="submit" className="btn-primary">
                <Phone className="size-[18px]" aria-hidden />
                {p(t.ringNow)}
              </button>
            </form>
          ) : null}

          <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(6.5rem,1fr))]">
            <a href={`tel:${tel}`} className="action-tile text-foreground">
              <Phone className="size-5" aria-hidden />
              {p(t.callMaa)}
            </a>
            {state === "trying" ? (
              <form action={markOk} className="flex flex-1">
                <button type="submit" className="action-tile text-foreground">
                  <ShieldCheck className="size-5" aria-hidden />
                  {p(t.shesOk)}
                </button>
              </form>
            ) : data.call && (state === "good" || state === "look") ? (
              <Link href={`/d/${token}/calls/${data.call.id}?lang=${lang}&from=today`} className="action-tile text-foreground">
                <UserRound className="size-5" aria-hidden />
                {t.seeTodaysCall}
              </Link>
            ) : state === "scheduled" && data.yesterday ? (
              <Link href={`/d/${token}/calls/${data.yesterday.id}?lang=${lang}&from=today`} className="action-tile text-foreground">
                <CalendarDays className="size-5" aria-hidden />
                {t.seeYesterday}
              </Link>
            ) : (
              <Link href={`/d/${token}/history?lang=${lang}&days=7`} className="action-tile text-foreground">
                <CalendarDays className="size-5" aria-hidden />
                {t.history}
              </Link>
            )}
            {neighbourTel && (state === "trying" || state === "act") ? (
              <a href={`tel:${neighbourTel}`} className="action-tile text-foreground">
                <HeartHandshake className="size-5" aria-hidden />
                {neighbourName || t.neighbourWord}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {firstRun ? (
        <section className="rise mt-6" style={{ "--d": "120ms" } as CSSProperties}>
          <p className="section-label">{t.setupChecklist}</p>
          <ol className="list-group mt-2">
            {[
              { text: p(t.setupTell) },
              { text: t.setupSaveNumber },
              { text: data.neighbour ? t.setupNeighbourWait : t.setupNoNeighbour },
              { text: p(t.setupConsentPending) },
            ].map((item, i) => (
              <li key={item.text} className="list-row items-start">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand-deep">
                  {i + 1}
                </span>
                <span className="text-[15px] leading-6">{item.text}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {state === "scheduled" && data.yesterday ? (
        <section className="rise mt-6" style={{ "--d": "120ms" } as CSSProperties}>
          <p className="section-label">{t.seeYesterday}</p>
          <Link href={`/d/${token}/calls/${data.yesterday.id}?lang=${lang}&from=today`} className="card mt-2 flex items-center gap-3 p-4">
            <p className="flex-1 text-[15px] leading-6 text-muted-foreground">
              {pickLocale(lang, data.yesterday.summary_en, data.yesterday.summary_hi)}
            </p>
            <ChevronRight className="size-5 shrink-0 text-ink-3" aria-hidden />
          </Link>
        </section>
      ) : null}

      {data.doses.length > 0 ? (
        <section className="rise mt-6" style={{ "--d": "160ms" } as CSSProperties}>
          <p className="section-label">{t.medicinesToday}</p>
          <ul className="list-group mt-2">
            {data.doses.map((dose) => (
              <li key={`${dose.medicine_id}-${dose.meal}`} className="list-row">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sage-soft text-sage">
                  <IconMedicine className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-medium">{dose.name}</span>
                  <span className="block text-[13px] text-ink-3">{slotLabel(dose.meal, lang)}</span>
                </span>
                <span className="shrink-0">
                  <DosePill status={dose.status} lang={lang} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {showQuote ? (
        <section className="rise mt-6" style={{ "--d": "200ms" } as CSSProperties}>
          <p className="section-label">{t.inHerWords}</p>
          <figure className="card grain mt-2 p-5">
            <Quote className="size-6 text-primary/40" aria-hidden />
            <blockquote className="font-devanagari mt-2 text-[20px] leading-[1.55]">{quote}</blockquote>
            <figcaption className="mt-3 text-[13px] leading-5 text-ink-3">
              {t.fromTodaysCall}. {p(t.moodCaption)}
            </figcaption>
          </figure>
        </section>
      ) : null}

      {data.weekly.built ? (
        <section className="rise mt-6" style={{ "--d": "220ms" } as CSSProperties}>
          <p className="section-label">{t.weeklyNote}</p>
          <div className="card mt-2 p-4">
            <p className="text-[15px] leading-relaxed">{weeklyDeskCopy(data.weekly.built, lang)}</p>
            <Link href={`/d/${token}/history?lang=${lang}&days=7`} className="mt-3 inline-block text-[14px] font-medium text-primary">
              {t.weeklySeeHistory}
            </Link>
          </div>
        </section>
      ) : null}

      <section className="rise mt-6" style={{ "--d": "240ms" } as CSSProperties}>
        <div className="flex items-baseline justify-between px-1">
          <p className="section-label px-0">{t.thisWeek}</p>
          <Link href={`/d/${token}/history?lang=${lang}&days=7`} className="text-[14px] font-medium text-primary">
            {t.history}
          </Link>
        </div>
        <Link href={`/d/${token}/history?lang=${lang}&days=7`} className="card mt-2 block p-4">
          <ol className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {Array.from({ length: 7 }, (_, i) => {
              const [y, m, d] = data.day.split("-").map(Number);
              const dt = new Date(y, m - 1, d + i - 6);
              const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
              const call = weekDays.find((c) => c.started_at.startsWith(key));
              const isToday = i === 6;
              return (
                <li key={key} className="flex min-w-0 flex-col items-center gap-1.5">
                  <span className={`max-w-full truncate text-[10px] sm:text-[12px] ${isToday ? "font-semibold text-foreground" : "text-ink-3"}`}>
                    {weekdayShort(key, lang)}
                  </span>
                  <span
                    className={`grid size-8 place-items-center rounded-full sm:size-9 ${
                      call?.status === "completed"
                        ? "bg-good text-white"
                        : call?.status === "missed"
                          ? "border-2 border-amber-line text-amber-ink"
                          : "bg-sunk text-ink-3"
                    } ${isToday ? "ring-2 ring-primary/30 ring-offset-2 ring-offset-card" : ""}`}
                  >
                    {call?.status === "completed" ? (
                      <Check className="size-4" strokeWidth={3} aria-hidden />
                    ) : call?.status === "missed" ? (
                      <X className="size-4" strokeWidth={2.5} aria-hidden />
                    ) : call ? (
                      <Minus className="size-4" aria-hidden />
                    ) : (
                      <Circle className="size-2 fill-current" aria-hidden />
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </Link>
      </section>

      <p className="mt-8 px-2 text-center text-[12px] leading-5 text-ink-3">{t.aboutBody}</p>
    </>
  );
}
