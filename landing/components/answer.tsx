"use client";

import { AlertTriangle, Check, Phone, Smile, X } from "lucide-react";
import { useState } from "react";
import { DeviceFrame, StatusDot } from "@/components/kit";
import { SectionHead } from "@/components/chrome";
import { content } from "@/lib/content";

const tone = {
  good: { card: "bg-good-soft", ink: "text-good", glow: "#dcefe3", icon: Smile },
  look: { card: "bg-look-soft", ink: "text-look-ink", glow: "#fbe6c2", icon: AlertTriangle },
  act: { card: "bg-act-soft", ink: "text-act", glow: "#f6d3cd", icon: AlertTriangle },
} as const;

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function Answer() {
  const t = content.answer;
  const [tab, setTab] = useState(0);
  const cur = t.tabs[tab];
  const k = tone[cur.id];

  return (
    <section id="today" className="section overflow-x-clip bg-bg-elevated">
      <div className="container-site grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
        <div>
          <SectionHead eyebrow={t.eyebrow} a={t.h2a} b={t.h2b} sub={t.sub} />
          <div className="mt-10 flex flex-col gap-2.5" role="radiogroup" aria-label="Example mornings" data-reveal>
            {t.tabs.map((x, i) => {
              const on = i === tab;
              return (
                <button
                  key={x.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setTab(i)}
                  className={`flex items-start gap-4 rounded-[20px] border p-5 text-left transition-[background,border-color,box-shadow] duration-300 ${
                    on ? "border-ink/15 bg-bg shadow-[var(--shadow-mock)]" : "border-border hover:border-ink/15"
                  }`}
                >
                  <span
                    className={`mt-1 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                      on ? "border-ink bg-ink" : "border-border"
                    }`}
                    aria-hidden
                  >
                    {on ? <span className="size-1.5 rounded-full bg-bg" /> : null}
                  </span>
                  <span>
                    <span className="flex items-center gap-2 text-[16px] font-medium">
                      <StatusDot tone={x.id} />
                      {x.chip}
                    </span>
                    <span className="mt-1 block text-[14.5px] leading-relaxed text-ink-2">{x.blurb}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[340px]" data-reveal>
          <div
            className="absolute inset-[-18%] -z-0 rounded-full blur-3xl transition-[background] duration-700"
            style={{ background: `radial-gradient(closest-side, ${k.glow}, transparent)` }}
            aria-hidden
          />
          <DeviceFrame className="relative mx-auto max-w-[300px]">
            <div
              key={cur.id}
              className="screen-fade flex h-full min-h-0 flex-col gap-2.5 overflow-hidden px-3.5 pb-3"
              aria-label="Example: family Today screen"
              aria-live="polite"
            >
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-[19px] font-semibold leading-tight">{t.header}</p>
                  <p className="text-[10.5px] text-ink-3">{t.date}</p>
                </div>
                <span className="rounded-full bg-look-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-look-ink">
                  Example
                </span>
              </div>

              <div className={`rounded-[16px] p-3.5 ${k.card}`}>
                <p className={`flex items-center gap-1.5 text-[12px] font-semibold ${k.ink}`}>
                  <k.icon className="size-3.5" strokeWidth={2.25} aria-hidden />
                  {cur.chip}
                </p>
                <p className="mt-1.5 text-[16.5px] font-semibold leading-snug text-ink">{cur.headline}</p>
                <p className="mt-0.5 text-[12px] text-ink-2">{cur.detail}</p>
                <span className="mt-3 flex h-9 items-center justify-center gap-1.5 rounded-full bg-accent text-[12.5px] font-medium text-white">
                  <Phone className="size-3.5" strokeWidth={2.25} aria-hidden />
                  {t.callMaa}
                </span>
                {cur.id === "act" ? <p className="mt-2 text-[10.5px] font-medium text-act">{t.emergency}</p> : null}
              </div>

              <div className="rounded-[16px] border border-border bg-bg-elevated p-3">
                <p className="text-[11px] text-ink-3">{t.medsTitle}</p>
                <ul className="mt-1.5 space-y-1.5">
                  {cur.meds.map((m) => (
                    <li key={m.name} className="flex items-center justify-between text-[12.5px]">
                      <span>
                        {m.name} <span className="text-ink-3">· {m.slot}</span>
                      </span>
                      <span
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          m.taken ? "bg-good-soft text-good" : "bg-look-soft text-look-ink"
                        }`}
                      >
                        {m.taken ? (
                          <Check className="size-3" strokeWidth={3} aria-hidden />
                        ) : (
                          <X className="size-3" strokeWidth={3} aria-hidden />
                        )}
                        {m.taken ? t.taken : t.missed}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[16px] border border-border bg-bg-elevated p-3">
                <p className="text-[11px] text-ink-3">{t.wordsTitle}</p>
                <p className="font-deva mt-1 text-[14px] leading-snug" lang="hi">
                  “{cur.quote}”
                </p>
              </div>

              <div className="rounded-[16px] border border-border bg-bg-elevated p-3">
                <p className="text-[11px] text-ink-3">{t.weekTitle}</p>
                <div className="mt-2 grid grid-cols-7 gap-1 text-center">
                  {cur.week.map((d, i) => (
                    <span key={i} className="flex flex-col items-center gap-1 text-[9.5px] text-ink-3">
                      <StatusDot tone={d as "good" | "look" | "act"} className={i === 6 ? "size-3 ring-2 ring-offset-1 ring-ink/10" : "size-2.5"} />
                      {DAYS[i]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </DeviceFrame>
        </div>
      </div>
    </section>
  );
}
