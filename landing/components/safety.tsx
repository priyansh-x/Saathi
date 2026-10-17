"use client";

import { useEffect, useRef, useState } from "react";
import { content } from "@/lib/content";
import { Eyebrow } from "./chrome";

export function Safety() {
  const t = content.safety;
  const [split, setSplit] = useState(50);
  const [mode, setMode] = useState<"left" | "right">("left");
  const [steps, setSteps] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);

  function setFromClientX(x: number) {
    const box = track.current?.getBoundingClientRect();
    if (!box) return;
    const p = Math.min(100, Math.max(0, ((x - box.left) / box.width) * 100));
    setSplit(p);
  }

  useEffect(() => {
    const el = right.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        if (reduced) {
          setSteps(t.steps.length);
          return;
        }
        let n = 0;
        const id = window.setInterval(() => {
          n += 1;
          setSteps(n);
          if (n >= t.steps.length) window.clearInterval(id);
        }, 400);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [t.steps.length]);

  const leftPane = (
    <div className="h-full bg-bg p-5">
      <p className="font-medium">{t.leftTitle}</p>
      <div className="mt-4 max-w-sm rounded-2xl bg-white p-3 text-sm shadow-sm">{t.leftBubble}</div>
      <p className="mt-2 font-mono text-[11px] text-ink-2">{t.leftTime}</p>
      <p className="mt-6 text-ink-2">{t.leftCaption}</p>
    </div>
  );

  const rightPane = (
    <div ref={right} className="h-full bg-bg p-5">
      <p className="font-medium">{t.rightTitle}</p>
      <ol className="mt-4 space-y-2 text-sm">
        {t.steps.slice(0, steps).map((s) => (
          <li key={s} className="rounded-2xl border border-border bg-bg-elevated px-3 py-2">
            {s}
          </li>
        ))}
      </ol>
      {steps >= t.steps.length ? (
        <div className="mt-3 space-y-2 text-sm">
          <p className="rounded-full bg-look-soft px-3 py-1.5 text-look-ink">{t.going}</p>
          <p className="rounded-full bg-good-soft px-3 py-1.5 text-good">{t.clear}</p>
        </div>
      ) : null}
      <p className="example-tag mt-4">{t.caption}</p>
    </div>
  );

  return (
    <section id="safety" className="section">
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

        <div className="mt-8 md:hidden">
          <div className="flex gap-2">
            <button type="button" className={`rounded-full px-3 py-2 text-sm ${mode === "left" ? "bg-ink text-bg" : "border border-border"}`} onClick={() => setMode("left")}>
              {t.leftTitle}
            </button>
            <button type="button" className={`rounded-full px-3 py-2 text-sm ${mode === "right" ? "bg-ink text-bg" : "border border-border"}`} onClick={() => setMode("right")}>
              {t.rightTitle}
            </button>
          </div>
          <div className="mt-4 overflow-hidden rounded-[24px] border border-border">{mode === "left" ? leftPane : rightPane}</div>
        </div>

        <div
          ref={track}
          className="relative mt-10 hidden overflow-hidden rounded-[28px] border border-border shadow-[var(--shadow-mock)] md:block"
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            setFromClientX(e.clientX);
          }}
          onPointerMove={(e) => {
            if (e.buttons) setFromClientX(e.clientX);
          }}
        >
          <div className="grid min-h-[420px] grid-cols-2">
            {leftPane}
            {rightPane}
          </div>
          <div className="pointer-events-none absolute inset-y-0 bg-bg/40" style={{ left: `${split}%`, right: 0 }} />
          <div
            role="slider"
            tabIndex={0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(split)}
            aria-label="Compare a normal morning and a missed morning"
            className="absolute top-0 z-10 h-full w-1 -translate-x-1/2 bg-accent"
            style={{ left: `${split}%` }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") setSplit((s) => Math.max(0, s - 10));
              if (e.key === "ArrowRight") setSplit((s) => Math.min(100, s + 10));
            }}
          >
            <span className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-bg-elevated shadow" />
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-[16px] text-ink-2">{t.disclaimer}</p>
      </div>
    </section>
  );
}
