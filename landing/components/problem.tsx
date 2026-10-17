"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { content } from "@/lib/content";
import { Eyebrow } from "./chrome";

export function Problem() {
  const t = content.problem;
  const [n, setN] = useState(1);
  const [clock, setClock] = useState("11:42");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    };
    tick();
    const c = window.setInterval(tick, 1000);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const later = window.setTimeout(() => setN(t.notifications.length), 0);
      return () => {
        window.clearInterval(c);
        window.clearTimeout(later);
      };
    }
    const loop = window.setInterval(() => {
      setN((x) => (x >= t.notifications.length ? 1 : x + 1));
    }, 2000);
    return () => {
      window.clearInterval(c);
      window.clearInterval(loop);
    };
  }, [t.notifications.length]);

  return (
    <section id="problem" className="section">
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
        <p className="mt-4 max-w-2xl text-sm text-ink-2">{t.whyNow}</p>

        <div className="mx-auto mt-10 max-w-sm md:mt-14" data-reveal>
          <div
            className="overflow-hidden rounded-[44px] border border-border bg-dark p-5 text-dark-ink shadow-[var(--shadow-mock)]"
            aria-label="Example: a night of unanswered questions"
          >
            <p className="text-center font-mono text-5xl tabular-nums">{clock}</p>
            <p className="mt-1 text-center text-sm text-dark-muted">Saturday</p>
            <ol className="mt-6 max-h-72 space-y-2 overflow-hidden" data-loop aria-hidden>
              {t.notifications.slice(0, n).map((note, i) => (
                <li
                  key={note}
                  className="flex gap-3 rounded-2xl bg-dark-elevated px-3 py-2 text-sm"
                  style={{ animation: "stack-in 0.45s var(--ease) both" }}
                >
                  <Bell className="mt-0.5 size-4 shrink-0 text-dark-accent" />
                  <span>
                    {note}
                    <span className="ml-2 font-mono text-[11px] text-dark-muted">{8 + i}:1{i}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <p className="example-tag mt-3 text-center">{t.caption}</p>
        </div>
      </div>
      <p className="h2 mx-auto mt-20 max-w-5xl px-5 text-center" data-reveal>
        {t.closerA}
        <br />
        <span className="accent-word">{t.closerB}</span>
      </p>
    </section>
  );
}
