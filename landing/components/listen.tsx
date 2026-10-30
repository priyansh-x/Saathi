"use client";

import { useEffect, useRef, useState } from "react";
import { MiniMark } from "@/components/chrome";
import { DeviceFrame, ExampleTag, Waveform, WhatsAppBriefing } from "@/components/kit";
import { content, type LangId } from "@/lib/content";
import { useInView, usePrefersReducedMotion } from "@/lib/use-reveal";

const CPS = 34;

export function Listen() {
  const t = content.listen;
  const [lang, setLang] = useState<LangId>("hi");
  const [turn, setTurn] = useState(0);
  const [chars, setChars] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, 0.3);
  const reduced = usePrefersReducedMotion();
  const lines = t.transcripts[lang];
  const current = lines[Math.min(turn, lines.length - 1)];
  const shown = reduced ? lines : lines.slice(0, turn);

  useEffect(() => {
    if (reduced || !inView || turn >= lines.length) return;
    const target = lines[turn]?.text.length ?? 0;
    if (chars < target) {
      const id = window.setTimeout(() => setChars((n) => n + 1), 1000 / CPS);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => {
      setTurn((n) => n + 1);
      setChars(0);
    }, 1100);
    return () => window.clearTimeout(id);
  }, [inView, reduced, turn, chars, lines]);

  function pick(id: LangId) {
    setLang(id);
    setTurn(reduced ? content.listen.transcripts[id].length : 0);
    setChars(0);
  }

  return (
    <section id="listen" className="section pt-4 md:pt-8">
      <div className="container-site">
        <div data-reveal>
          <h2 className="h2">{t.h2}</h2>
          <p className="sub mt-4">{t.sub}</p>
        </div>

        <div ref={ref} className="mt-10 rounded-[24px] border border-border bg-bg-sunk px-4 py-8 md:mt-14 md:px-10 md:py-12" data-reveal>
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="seg max-w-full overflow-x-auto" role="group" aria-label="Call language">
              {t.languages.map((l) => {
                const id = l.live ? (l.id as LangId) : null;
                return (
                  <button
                    key={l.id}
                    type="button"
                    disabled={!id}
                    aria-pressed={id === lang}
                    onClick={() => id && pick(id)}
                    className="disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {l.label}
                    {!l.live ? <span className="text-[11px]">{t.soon}</span> : null}
                  </button>
                );
              })}
            </div>
            <ExampleTag>{t.tag}</ExampleTag>
          </div>

          <div className="mt-10 grid items-center justify-items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
            <DeviceFrame dark time="8:04" className="max-w-[260px]">
              <div className="flex h-full min-h-0 flex-col px-4 pb-5 text-dark-ink" aria-label="Example: morning call transcript">
                <div className="mt-4 text-center">
                  <span className="mx-auto grid size-12 place-items-center">
                    <MiniMark className="size-12" />
                  </span>
                  <p className="mt-2 text-[15px] font-medium">{t.caller}</p>
                  <p className="font-mono text-[12px] text-dark-muted">{t.callClock}</p>
                  <Waveform bars={16} className="mx-auto mt-2 justify-center text-accent" />
                </div>
                <ol className="mt-4 flex flex-1 flex-col justify-end gap-2.5 overflow-hidden text-[13px] leading-snug">
                  {shown.slice(-4).map((line, idx) => (
                    <Bubble key={`${lang}-${idx}-${line.text}`} who={line.who} text={line.text} />
                  ))}
                  {!reduced && turn < lines.length && current ? (
                    <Bubble who={current.who} text={current.text.slice(0, chars)} typing />
                  ) : null}
                </ol>
              </div>
            </DeviceFrame>

            <p className="text-center text-[14px] text-ink-2">{t.toYou}</p>

            <DeviceFrame time="8:06" className="max-w-[260px]">
              <aside className="flex h-full min-h-0 flex-col overflow-hidden" aria-label="Example: WhatsApp briefing">
                <WhatsAppBriefing />
              </aside>
            </DeviceFrame>
          </div>
        </div>
      </div>
    </section>
  );
}

function Bubble({ who, text, typing = false }: { who: "saathi" | "maa"; text: string; typing?: boolean }) {
  const maa = who === "maa";
  return (
    <li className={`screen-fade flex ${maa ? "justify-end" : "justify-start"}`}>
      <p
        lang="hi"
        className={`max-w-[85%] rounded-[14px] px-3 py-2 ${
          maa ? "rounded-br-[4px] bg-accent text-white" : "rounded-bl-[4px] bg-white/10 text-dark-ink"
        }`}
      >
        {text}
        {typing ? <span className="caret !bg-current" aria-hidden /> : null}
      </p>
    </li>
  );
}
