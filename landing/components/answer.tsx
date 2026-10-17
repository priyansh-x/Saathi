"use client";

import { AlertOctagon, AlertTriangle, Check, Phone } from "lucide-react";
import { useState } from "react";
import { ExampleTag, PhoneFrame } from "@/components/kit";
import { content } from "@/lib/content";
import { Eyebrow } from "./chrome";

export function Answer() {
  const t = content.answer;
  const [tab, setTab] = useState(0);
  const cur = t.tabs[tab];
  const Icon = cur.id === "good" ? Check : cur.id === "look" ? AlertTriangle : AlertOctagon;
  const tone =
    cur.id === "good"
      ? "bg-good-soft text-good"
      : cur.id === "look"
        ? "bg-look-soft text-look-ink"
        : "bg-act-soft text-act";

  return (
    <section id="how" className="section">
      <div className="container-site">
        <Eyebrow n={t.eyebrowN} label={t.eyebrow} />
        <div className="mt-6 grid items-start gap-10 md:grid-cols-2">
          <div>
            <h2 className="h2" data-reveal>
              {t.h2a}
              <br />
              <span className="serif-line">{t.h2b}</span>
            </h2>
            <ul className="mt-10 space-y-3 text-2xl" data-reveal>
              {t.strikes.map((line) => (
                <li key={line} className="relative w-fit">
                  {line}
                  <svg className="pointer-events-none absolute inset-x-0 top-1/2 h-3 w-full" viewBox="0 0 200 12" aria-hidden>
                    <path
                      d="M2 8 C 40 2, 80 12, 198 4"
                      fill="none"
                      stroke="var(--ink)"
                      strokeWidth="2"
                      strokeDasharray="1"
                      strokeDashoffset="1"
                      pathLength="1"
                      className="[animation:strike_0.9s_var(--ease)_forwards] motion-reduce:[stroke-dashoffset:0]"
                    />
                  </svg>
                </li>
              ))}
              <li className="serif-line text-3xl">{t.just}</li>
            </ul>
            <p className="mt-8 text-[14px] text-ink-2">{t.modules}</p>
          </div>

          <div className="mx-auto w-full max-w-[360px]">
            <ExampleTag />
            <PhoneFrame className="mt-2">
              <div aria-label="Example: family Today card">
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-medium">{t.header}</span>
                  <span className="text-[13px] text-ink-2">EN | हिं</span>
                </div>
                <div className={`mx-3 rounded-[20px] px-4 py-3 ${tone}`}>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="size-4" strokeWidth={1.5} aria-hidden />
                    {cur.chip}
                  </p>
                  <p className="mt-2 text-lg font-medium">{cur.headline}</p>
                  <p className="mt-1 text-sm opacity-90">{cur.detail}</p>
                  <span className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm text-white">
                    <Phone className="mr-1 size-4" strokeWidth={1.5} aria-hidden /> Call Maa
                  </span>
                  {cur.id === "act" ? <p className="mt-3 text-xs">{t.emergency}</p> : null}
                </div>
                <div className="space-y-3 p-4 text-sm">
                  <div className="rounded-[20px] border border-border bg-bg-elevated p-3">
                    <p className="text-ink-2">Medicines today</p>
                    <p>BP tablet · Taken</p>
                    <p>Sugar tablet · Taken</p>
                  </div>
                  <div className="rounded-[20px] border border-border bg-bg-elevated p-3">
                    <p className="text-ink-2">In her words</p>
                    <p className="font-deva text-base" lang="hi">
                      “{cur.quote}”
                    </p>
                  </div>
                  <div>
                    <p className="text-ink-2">This week</p>
                    <div className="mt-1 flex gap-2">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <span key={i} className="size-2 rounded-full bg-good" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </PhoneFrame>
            <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Status examples">
              {t.tabs.map((tabItem, i) => (
                <button
                  key={tabItem.id}
                  type="button"
                  role="tab"
                  aria-selected={i === tab}
                  onClick={() => setTab(i)}
                  className={`rounded-full px-3 py-2 text-sm ${i === tab ? "bg-ink text-bg" : "border border-border text-ink-2"}`}
                >
                  {tabItem.chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
