"use client";

import Image from "next/image";
import { AlertOctagon, AlertTriangle, Bell, Check, Clock, Phone, Pill, Quote, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { DeviceFrame, ExampleTag, StatusDot, Waveform } from "@/components/kit";
import { content } from "@/lib/content";
import { useInView, usePrefersReducedMotion } from "@/lib/use-reveal";
import { Eyebrow } from "./chrome";
import neighbourImg from "@/public/images/neighbour-knock.jpg";

const CYCLE_MS = 5200;
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

const tone = {
  good: { card: "bg-good-soft text-good border-good/15", Icon: Check },
  look: { card: "bg-look-soft text-look-ink border-look-line/25", Icon: AlertTriangle },
  act: { card: "bg-act-soft text-act border-act/20", Icon: AlertOctagon },
} as const;

export function Answer() {
  const t = content.answer;
  const [tab, setTab] = useState(0);
  const [auto, setAuto] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, 0.3);
  const reduced = usePrefersReducedMotion();
  const cur = t.tabs[tab];
  const { card, Icon } = tone[cur.id];

  useEffect(() => {
    if (!auto || reduced || !inView) return;
    const id = window.setTimeout(() => setTab((n) => (n + 1) % t.tabs.length), CYCLE_MS);
    return () => window.clearTimeout(id);
  }, [auto, reduced, inView, tab, t.tabs.length]);

  return (
    <section id="how" className="section bg-bg-elevated">
      <div className="container-site">
        <Eyebrow n={t.eyebrowN} label={t.eyebrow} />
        <div ref={ref} className="mt-6 grid items-center gap-14 lg:grid-cols-2">
          <div>
            <h2 className="h2" data-reveal>
              {t.h2a}
              <br />
              <span className="serif-line">{t.h2b}</span>
            </h2>
            <ul className="mt-8 space-y-1 text-[22px] text-ink-3" data-reveal>
              {t.strikes.map((line, i) => (
                <li key={line} className="relative w-fit">
                  {line}
                  <svg className="pointer-events-none absolute inset-x-0 top-1/2 h-3 w-full -translate-y-1/2" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden>
                    <path
                      d="M2 8 C 40 2, 80 12, 198 4"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="1"
                      strokeDashoffset="1"
                      pathLength="1"
                      style={{ animationDelay: `${400 + i * 250}ms` }}
                      className="[animation:strike_0.8s_var(--ease)_forwards] motion-reduce:[stroke-dashoffset:0]"
                    />
                  </svg>
                </li>
              ))}
              <li className="serif-line pt-2 text-[34px] text-ink">{t.just}</li>
            </ul>

            <div className="mt-10" data-reveal>
              <p className="text-[14px] text-ink-2">What you see each morning</p>
              <div className="seg mt-3" role="group" aria-label="Example states">
                {t.tabs.map((x, i) => (
                  <button
                    key={x.id}
                    type="button"
                    aria-pressed={i === tab}
                    onClick={() => {
                      setAuto(false);
                      setTab(i);
                    }}
                  >
                    <StatusDot tone={x.id} />
                    {x.chip}
                  </button>
                ))}
              </div>
              <div className="mt-3 h-0.5 w-full max-w-[22rem] overflow-hidden rounded-full bg-border">
                {auto && !reduced && inView ? (
                  <span key={tab} className="progress-bar block h-full bg-accent" style={{ "--dur": `${CYCLE_MS}ms` } as CSSProperties} />
                ) : null}
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[340px]" data-reveal>
            <div className="halo pointer-events-none absolute -inset-16 -z-0 opacity-50" aria-hidden />
            <DeviceFrame className="relative mx-auto max-w-[280px]">
              <div key={cur.id} className="screen-fade flex h-full min-h-0 flex-col gap-2 overflow-hidden px-3 pb-3" aria-label="Example: family Today screen" aria-live="polite">
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-[18px] font-semibold leading-tight">{t.header}</p>
                    <p className="text-[10.5px] text-ink-3">{t.date}</p>
                  </div>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10.5px] text-ink-2">EN | हिं</span>
                </div>

                <div className={`rounded-[18px] border p-3 ${card}`}>
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold">
                    <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
                    {cur.chip}
                  </p>
                  <p className="mt-1.5 text-[16px] font-semibold leading-snug text-ink">{cur.headline}</p>
                  <p className="mt-0.5 text-[12px] text-ink-2">{cur.detail}</p>
                  <span className="mt-2.5 flex h-9 items-center justify-center gap-1.5 rounded-full bg-accent text-[12.5px] font-medium text-white">
                    <Phone className="size-3.5" strokeWidth={2} aria-hidden /> Call Maa
                  </span>
                  {cur.id === "act" ? <p className="mt-2 text-[10.5px] font-medium">{t.emergency}</p> : null}
                </div>

                <div className="rounded-[16px] border border-border bg-bg-elevated p-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-3">Medicines today</p>
                  <ul className="mt-1.5 space-y-1.5">
                    {cur.meds.map((m) => (
                      <li key={m.name} className="flex items-center justify-between text-[12.5px]">
                        <span className="flex items-center gap-2">
                          <Pill className="size-3.5 text-ink-3" strokeWidth={1.75} aria-hidden />
                          {m.name} <span className="text-ink-3">· {m.slot}</span>
                        </span>
                        {m.taken ? (
                          <span className="flex items-center gap-1 rounded-full bg-good-soft px-2 py-0.5 text-[11px] text-good">
                            <Check className="size-3" strokeWidth={2.5} aria-hidden /> Taken
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-look-soft px-2 py-0.5 text-[11px] text-look-ink">
                            <X className="size-3" strokeWidth={2.5} aria-hidden /> Missed
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[16px] border border-border bg-bg-elevated p-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-3">In her words</p>
                  <p className="font-deva mt-1 text-[14px] leading-snug" lang="hi">
                    “{cur.quote}”
                  </p>
                </div>

                <div className="rounded-[16px] border border-border bg-bg-elevated p-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-3">This week</p>
                  <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px] text-ink-3">
                    {cur.week.map((w, i) => (
                      <span key={i} className="flex flex-col items-center gap-1">
                        <StatusDot tone={w as "good" | "look" | "act"} />
                        {DAYS[i]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </DeviceFrame>
            <ExampleTag className="mt-4 text-center" />
          </div>
        </div>

        <Features />
      </div>
    </section>
  );
}

function Features() {
  const t = content.answer;
  const f = Object.fromEntries(t.features.map((x) => [x.id, x])) as Record<
    (typeof t.features)[number]["id"],
    (typeof t.features)[number]
  >;

  return (
    <div className="mt-28 md:mt-36">
      <h3 className="h2 max-w-[24ch] text-[clamp(1.75rem,3.2vw,2.6rem)]" data-reveal>
        {t.featuresTitle}
      </h3>
      <div className="mt-10 grid gap-4 md:grid-cols-6">
        <Card className="md:col-span-3" title={f.call.title} body={f.call.body} rd={0}>
          <div className="flex items-center gap-3 rounded-[16px] bg-bg-sunk p-3">
            <span className="grid size-10 place-items-center rounded-full bg-good text-white">
              <Phone className="size-4" strokeWidth={2} aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block text-[14px] font-medium">Saathi · every day</span>
              <span className="flex items-center gap-1 text-[12px] text-ink-3">
                <Clock className="size-3" strokeWidth={2} aria-hidden /> 8:00 AM IST
              </span>
            </span>
            <Waveform bars={12} className="text-accent" />
          </div>
        </Card>

        <Card className="md:col-span-3" title={f.meds.title} body={f.meds.body} rd={80}>
          <div className="flex gap-2">
            {[
              { n: "BP tablet", c: "bg-[#f3d9c9]", s: "After breakfast" },
              { n: "Sugar tablet", c: "bg-[#dfe8f3]", s: "Before dinner" },
            ].map((m) => (
              <div key={m.n} className="flex flex-1 items-center gap-2.5 rounded-[16px] bg-bg-sunk p-3">
                <span className={`h-5 w-9 rounded-full ${m.c} ring-1 ring-black/5`} aria-hidden />
                <span>
                  <span className="block text-[13px] font-medium">{m.n}</span>
                  <span className="block text-[11px] text-ink-3">{m.s}</span>
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="md:col-span-2" title={f.words.title} body={f.words.body} rd={0}>
          <div className="rounded-[16px] bg-accent-soft p-4 text-accent-deep">
            <Quote className="size-4 opacity-60" aria-hidden />
            <p className="font-deva mt-1 text-[17px]" lang="hi">
              घुटने का दर्द आज कम है।
            </p>
          </div>
        </Card>

        <Card className="md:col-span-2" title={f.alerts.title} body={f.alerts.body} rd={80}>
          <div className="flex items-center gap-3 rounded-[16px] border border-act/20 bg-act-soft p-3 text-act">
            <Bell className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            <span className="text-[13px] font-medium leading-snug">Maa said she fell · 8:09 AM</span>
          </div>
        </Card>

        <Card className="md:col-span-2" title={f.weekly.title} body={f.weekly.body} rd={160}>
          <div className="flex items-end gap-1.5 rounded-[16px] bg-bg-sunk p-3" aria-hidden>
            {[0.8, 0.9, 0.7, 0.5, 0.85, 0.95, 0.9].map((h, i) => (
              <span key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className={`w-full rounded-md ${i === 3 ? "bg-look-line" : "bg-good/70"}`} style={{ height: `${h * 44}px` }} />
                <span className="text-[10px] text-ink-3">{DAYS[i]}</span>
              </span>
            ))}
          </div>
        </Card>

        <article className="mock-card lift relative overflow-hidden md:col-span-6 md:grid md:grid-cols-2" data-reveal>
          <div className="p-6 md:p-10">
            <p className="text-[13px] font-medium text-accent">{f.neighbour.title}</p>
            <p className="mt-2 text-[24px] font-semibold leading-tight tracking-tight md:text-[30px]">{f.neighbour.body}</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-[14px] rounded-tl-[4px] bg-wa-out px-3 py-2 text-[14px] shadow-sm">
              <Check className="size-4 text-good" strokeWidth={2.5} aria-hidden />
              {t.neighbourBubble}
            </div>
          </div>
          <div className="relative aspect-[4/3] md:aspect-auto">
            <Image
              src={neighbourImg}
              alt={t.neighbourAlt}
              fill
              placeholder="blur"
              sizes="(min-width: 768px) 580px, 100vw"
              className="object-cover"
            />
          </div>
        </article>
      </div>
    </div>
  );
}

function Card({
  className = "",
  title,
  body,
  children,
  rd,
}: {
  className?: string;
  title: string;
  body: string;
  children: React.ReactNode;
  rd: number;
}) {
  return (
    <article
      className={`mock-card lift flex flex-col justify-between gap-6 p-6 ${className}`}
      data-reveal
      style={{ "--rd": `${rd}ms` } as CSSProperties}
    >
      <div>
        <p className="text-[17px] font-semibold tracking-tight">{title}</p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{body}</p>
      </div>
      {children}
    </article>
  );
}
