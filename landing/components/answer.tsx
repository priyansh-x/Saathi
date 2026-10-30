"use client";

import Image from "next/image";
import { AlertOctagon, AlertTriangle, Check, Phone, Pill, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { DeviceFrame, ExampleTag, StatusDot } from "@/components/kit";
import { content } from "@/lib/content";
import { useInView, usePrefersReducedMotion } from "@/lib/use-reveal";
import { Eyebrow } from "./chrome";
import neighbourImg from "@/public/images/neighbour-knock.jpg";

const CYCLE_MS = 5200;

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
        <Eyebrow label={t.eyebrow} />
        <div ref={ref} className="mt-6 grid items-center gap-14 lg:grid-cols-2">
          <div>
            <h2 className="h2" data-reveal>
              {t.h2a} {t.h2b}
            </h2>
            <p className="mt-5 text-[18px] text-ink-2">{t.just}</p>

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
            <DeviceFrame className="relative mx-auto max-w-[280px]">
              <div key={cur.id} className="screen-fade flex h-full min-h-0 flex-col gap-2 overflow-hidden px-3 pb-3" aria-label="Example: family Today screen" aria-live="polite">
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-[18px] font-semibold leading-tight">{t.header}</p>
                    <p className="text-[10.5px] text-ink-3">{t.date}</p>
                  </div>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10.5px] text-ink-2">Example</span>
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
  return (
    <div className="mt-20 grid gap-10 md:mt-28 md:grid-cols-2 md:items-center">
      <div data-reveal>
        <h3 className="text-[22px] font-semibold tracking-tight">{t.featuresTitle}</h3>
        <ul className="mt-6 space-y-6">
          {t.features.map((item) => (
            <li key={item.id}>
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
      <figure className="art relative aspect-[4/3]" data-reveal>
        <Image
          src={neighbourImg}
          alt={t.neighbourAlt}
          fill
          placeholder="blur"
          sizes="(min-width: 768px) 580px, 100vw"
          className="object-cover"
        />
        <figcaption className="absolute bottom-3 left-3 rounded-[12px] bg-bg-elevated px-3 py-2 text-[13px]">
          {t.neighbourBubble}
        </figcaption>
      </figure>
    </div>
  );
}
