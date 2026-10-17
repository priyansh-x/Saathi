"use client";

import { AlertOctagon, AlertTriangle, Check, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { content } from "@/lib/content";
import { Eyebrow } from "./chrome";

export function Answer() {
  const t = content.answer;
  const [tab, setTab] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setTab((n) => (n + 1) % t.tabs.length), 5000);
    return () => window.clearInterval(id);
  }, [paused, t.tabs.length]);

  const cur = t.tabs[tab];
  const Icon = cur.id === "good" ? Check : cur.id === "look" ? AlertTriangle : AlertOctagon;
  const tone =
    cur.id === "good" ? "border-good bg-good-soft text-good" : cur.id === "look" ? "border-look-line bg-look-soft text-look-ink" : "border-act bg-act-soft text-act";

  return (
    <section id="how" className="dark-band bg-dark text-dark-ink" data-band="dark">
      <div className="section container-site">
        <Eyebrow n={t.eyebrowN} label={t.eyebrow} />
        <div className="mt-6 grid items-end gap-8 md:grid-cols-2">
          <div>
            <h2 className="h2" data-reveal>
              {t.h2a}
              <br />
              <span className="accent-word">{t.h2b}</span>
            </h2>
            <ul className="mt-10 space-y-3 text-2xl" data-reveal>
              {t.strikes.map((line) => (
                <li key={line} className="relative w-fit">
                  {line}
                  <svg className="pointer-events-none absolute inset-x-0 top-1/2 h-3 w-full" viewBox="0 0 200 12" aria-hidden>
                    <path
                      d="M2 8 C 40 2, 80 12, 198 4"
                      fill="none"
                      stroke="var(--dark-accent)"
                      strokeWidth="3"
                      strokeDasharray="1"
                      strokeDashoffset="1"
                      pathLength="1"
                      className="[animation:strike_0.9s_var(--ease)_forwards] motion-reduce:stroke-dashoffset-0"
                    />
                  </svg>
                </li>
              ))}
              <li className="font-serif text-3xl italic text-dark-accent">{t.just}</li>
            </ul>
          </div>

          <div
            className="relative"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
            <p className="example-tag mb-2 text-right text-dark-muted">EXAMPLE · fictional</p>
            <div className="overflow-hidden rounded-[44px] border border-white/10 bg-[#fbf7f2] text-ink shadow-[var(--shadow-mock)]" aria-label="Example: family Today card">
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="font-medium">{t.header}</span>
                <span className="font-mono text-xs text-ink-2">EN | हिं</span>
              </div>
              <div className={`mx-3 rounded-2xl border-l-4 px-4 py-3 transition-opacity duration-300 ${tone}`}>
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="size-4" />
                  {cur.chip}
                </p>
                <p className="mt-2 text-lg font-medium">{cur.headline}</p>
                <p className="mt-1 text-sm opacity-90">{cur.detail}</p>
                {cur.id === "act" ? (
                  <div className="mt-3 flex gap-2">
                    <span className="btn !h-10 !bg-act text-white">I&apos;m on it</span>
                    <span className="inline-flex h-10 items-center rounded-full border border-current px-3 text-sm">
                      <Phone className="mr-1 size-4" /> Call Maa
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <span className="inline-flex h-10 items-center rounded-full bg-accent px-3 text-sm text-white">Call Maa</span>
                    <span className="inline-flex h-10 items-center rounded-full border border-border px-3 text-sm">Send message</span>
                  </div>
                )}
              </div>
              <div className="space-y-3 p-4 text-sm">
                <div className="rounded-2xl border border-border bg-white p-3">
                  <p className="text-ink-2">Medicines today</p>
                  <p>BP tablet ✓ Taken</p>
                  <p>Sugar tablet ✓ Taken</p>
                  <p className="text-ink-2">Sugar tablet night · Tomorrow&apos;s call</p>
                </div>
                <div className="rounded-2xl border border-border bg-white p-3">
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
                {cur.id === "act" ? <p className="text-xs text-act">{t.emergency}</p> : null}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Status examples">
              {t.tabs.map((tabItem, i) => (
                <button
                  key={tabItem.id}
                  type="button"
                  role="tab"
                  aria-selected={i === tab}
                  onClick={() => setTab(i)}
                  className={`rounded-full px-3 py-2 text-sm ${i === tab ? "bg-dark-ink text-ink" : "border border-white/15 text-dark-muted"}`}
                >
                  {tabItem.chip}
                </button>
              ))}
            </div>
            <p className="mt-4 font-mono text-[12px] text-dark-muted">{t.modules}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
