"use client";

import { Check, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { content } from "@/lib/content";
import { Eyebrow } from "./chrome";

export function Setup() {
  const t = content.setup;
  const [phone, setPhone] = useState(0);
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const later = window.setTimeout(() => setTicks(t.rows.length), 0);
      return () => window.clearTimeout(later);
    }
    const id = window.setInterval(() => {
      setTicks((n) => (n >= t.rows.length ? n : n + 1));
    }, 400);
    return () => window.clearInterval(id);
  }, [t.rows.length]);

  return (
    <section id="setup" className="section">
      <div className="container-site">
        <Eyebrow n={t.eyebrowN} label={t.eyebrow} />
        <div className="mt-6 grid items-end gap-6 md:grid-cols-12">
          <h2 className="h2 md:col-span-7" data-reveal>
            {t.h2a}
            <br />
            <span className="accent-word">{t.h2b}</span>
          </h2>
          <p className="text-[18px] text-ink-2 md:col-span-5">{t.sub}</p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink-2">Her phone:</span>
          {t.phones.map((p, i) => (
            <button
              key={p}
              type="button"
              onClick={() => setPhone(i)}
              className={`rounded-full px-3 py-2 text-sm ${i === phone ? "bg-ink text-bg" : "border border-border"}`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 rounded-[28px] border border-border bg-bg-elevated p-5 shadow-[var(--shadow-mock)] md:grid-cols-3 md:p-8">
          <ul className="space-y-2 text-sm">
            {t.rows.map((row, i) => (
              <li key={row} className="flex items-start gap-2 rounded-2xl border border-border px-3 py-2">
                <Check className={`mt-0.5 size-4 ${i < ticks ? "text-good" : "text-border"}`} />
                {row}
              </li>
            ))}
          </ul>
          <div className="grid place-items-center rounded-2xl bg-dark p-6 text-center text-dark-ink">
            <p className="font-mono text-[11px] uppercase text-dark-accent">Saathi</p>
            <p className="mt-2 text-lg">A morning call. Her number. Her yes.</p>
          </div>
          <div className="rounded-[28px] border border-border bg-bg p-4">
            <p className="font-medium">{t.voiceTitle}</p>
            <div className="mt-4 flex items-center gap-3 rounded-full border border-border px-3 py-2">
              <Play className="size-4" />
              <span className="h-1 flex-1 rounded-full bg-border">
                <span className="block h-1 w-1/3 rounded-full bg-accent" />
              </span>
              <span className="font-mono text-[11px]">{t.voiceBar}</span>
            </div>
          </div>
        </div>

        <ol className="mt-6 flex flex-wrap gap-2 text-sm">
          {t.steps.map((s) => (
            <li key={s.label} className="rounded-full border border-border px-3 py-2">
              {s.label}
              {s.state ? <span className="ml-2 text-ink-2">· {s.state}</span> : null}
            </li>
          ))}
        </ol>
        <p className="mt-4 max-w-2xl text-ink-2">{t.consent}</p>
      </div>
    </section>
  );
}
