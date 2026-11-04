"use client";

import { BellRing, MessageCircle, Phone, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { DeviceFrame } from "@/components/kit";
import { SectionHead } from "@/components/chrome";
import { content } from "@/lib/content";
import { useInView } from "@/lib/use-reveal";

type Mode = (typeof content.safety.modes)[number]["id"];
type Who = "saathi" | "child" | "act";

const whoStyle: Record<Who, { icon: typeof Phone; dot: string }> = {
  saathi: { icon: Phone, dot: "bg-bg-sunk text-ink-2" },
  child: { icon: MessageCircle, dot: "bg-good-soft text-good" },
  act: { icon: ShieldAlert, dot: "bg-act-soft text-act" },
};

export function Safety() {
  const t = content.safety;
  const [mode, setMode] = useState<Mode>("missed");
  const [minute, setMinute] = useState(0);
  const [touched, setTouched] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const inView = useInView(stage, 0.45);

  useEffect(() => {
    if (!inView || touched || mode !== "missed") return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const start = performance.now();
    const dur = 7000;
    const step = (now: number) => {
      const p = reducedMotion ? 1 : Math.min(1, (now - start) / dur);
      setMinute(Math.round(p * 60));
      if (p < 1) frame = requestAnimationFrame(step);
      else setTouched(true);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [inView, touched, mode]);

  const notes =
    mode === "missed"
      ? t.missed.filter((s) => "note" in s && s.at <= minute).map((s) => ({ who: s.who, note: (s as { note: string }).note, at: s.at }))
      : t.flag.filter((s) => "note" in s).map((s, i) => ({ who: s.who, note: (s as { note: string }).note, at: i }));
  const clockTime = mode === "missed" ? `${8 + Math.floor(minute / 60)}:${String(minute % 60).padStart(2, "0")}` : "8:34";

  return (
    <section id="safety" className="section">
      <div className="container-site">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHead eyebrow={t.eyebrow} a={t.h2a} b={t.h2b} sub={t.sub} />
          <div className="seg w-fit" role="group" aria-label="Scenario" data-reveal>
            {t.modes.map((m) => (
              <button key={m.id} type="button" aria-pressed={m.id === mode} onClick={() => setMode(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div ref={stage} className="mt-12 grid gap-4 md:mt-16 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="card flex flex-col p-5 sm:p-8 md:p-10" data-reveal>
            {mode === "missed" ? (
              <>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[13px] text-ink-3">{t.clockLabel}</p>
                    <p className="display mt-1 text-[64px] leading-none tracking-tight md:text-[80px]">
                      +{minute}
                      <span className="ml-1 text-[0.4em] text-ink-3">min</span>
                    </p>
                  </div>
                  <p className="pb-2 font-mono text-[14px] text-ink-2">{clockTime} AM</p>
                </div>
                <div className="relative mt-8">
                  <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-bg-sunk" aria-hidden>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(minute / 60) * 100}%`,
                        background: "linear-gradient(90deg, var(--sun), var(--accent) 70%, var(--act))",
                      }}
                    />
                  </div>
                  {t.missed.map((s) => (
                    <span
                      key={s.at}
                      className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg-elevated transition-colors ${
                        s.at <= minute ? (s.who === "act" ? "bg-act" : "bg-accent") : "bg-border"
                      }`}
                      style={{ left: `${(s.at / 60) * 100}%` }}
                      aria-hidden
                    />
                  ))}
                  <input
                    type="range"
                    min={0}
                    max={60}
                    value={minute}
                    onChange={(e) => {
                      setTouched(true);
                      setMinute(Number(e.target.value));
                    }}
                    className="range relative"
                    aria-label={t.clockLabel}
                  />
                </div>
                <div className="mt-2 flex justify-between font-mono text-[11px] text-ink-3" aria-hidden>
                  <span>0</span>
                  <span>30</span>
                  <span>60</span>
                </div>

                <ol className="mb-8 mt-8 grid gap-2 sm:grid-cols-2">
                  {t.missed.map((s) => {
                    const on = s.at <= minute;
                    const W = whoStyle[s.who];
                    return (
                      <li
                        key={s.at}
                        className={`flex gap-3 rounded-[16px] p-3 transition-[opacity,background] duration-300 ${
                          on ? "bg-bg opacity-100" : "opacity-40"
                        }`}
                      >
                        <span className={`grid size-9 shrink-0 place-items-center rounded-full ${W.dot}`}>
                          <W.icon className="size-4" strokeWidth={2} aria-hidden />
                        </span>
                        <span>
                          <span className="flex items-baseline gap-2">
                            <span className="text-[15px] font-medium">{s.title}</span>
                            <span className="font-mono text-[11px] text-ink-3">+{s.at}</span>
                          </span>
                          <span className="mt-0.5 block text-[13.5px] leading-snug text-ink-2">{s.body}</span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </>
            ) : (
              <ol className="relative mb-8 space-y-1">
                <span className="absolute bottom-8 left-[26px] top-8 w-px bg-border" aria-hidden />
                {t.flag.map((s, i) => {
                  const W = whoStyle[s.who];
                  return (
                    <li
                      key={s.title}
                      className="pop-in relative flex gap-4 rounded-[16px] p-3"
                      style={{ animationDelay: `${i * 220}ms` } as CSSProperties}
                    >
                      <span className={`relative grid size-9 shrink-0 place-items-center rounded-full ${W.dot}`}>
                        <W.icon className="size-4" strokeWidth={2} aria-hidden />
                      </span>
                      <span>
                        <span className="text-[17px] font-medium">{s.title}</span>
                        <span className="mt-0.5 block text-[15px] leading-relaxed text-ink-2">{s.body}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
            <p className="mt-auto flex items-center gap-2 rounded-[14px] bg-act-soft px-4 py-3 text-[14px] font-medium text-act">
              <ShieldAlert className="size-4 shrink-0" strokeWidth={2} aria-hidden />
              {t.disclaimer}
            </p>
          </div>

          <div
            className="relative flex items-center justify-center overflow-hidden rounded-[24px] bg-bg-sunk px-6 py-10"
            data-reveal
            style={{ "--rd": "100ms" } as CSSProperties}
          >
            <DeviceFrame dark overlay className="max-w-[280px]">
              <div className="flex h-full flex-col px-3 pt-12 text-dark-ink">
                <p className="text-center text-[11px] text-dark-muted">Saturday, 17 October</p>
                <p className="mt-1 text-center text-[64px] font-light leading-none tracking-tight tabular-nums">{clockTime}</p>
                <p className="mt-6 flex items-center gap-1.5 px-1 text-[11px] text-dark-muted">
                  <BellRing className="size-3" aria-hidden /> {t.lockTitle}
                </p>
                <ul className="mt-2 flex flex-col-reverse gap-2" aria-live="polite">
                  {notes.length === 0 ? (
                    <li className="rounded-[16px] bg-white/8 p-3 text-[12px] text-dark-muted">{t.nothingYet}</li>
                  ) : (
                    notes.map((n) => (
                      <li
                        key={`${mode}-${n.at}`}
                        className={`pop-in rounded-[16px] p-3 backdrop-blur ${n.who === "act" ? "bg-act/85" : "bg-white/12"}`}
                      >
                        <p className="flex items-center justify-between text-[10.5px] opacity-80">
                          <span>WhatsApp</span>
                          <span>now</span>
                        </p>
                        <p className="mt-1 text-[12.5px] font-medium leading-snug">{n.note}</p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </DeviceFrame>
            <p className="absolute bottom-3 left-0 right-0 text-center text-[12px] text-ink-3">{content.hero.example}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
