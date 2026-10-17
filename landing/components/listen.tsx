"use client";

import { MicOff, PhoneOff, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
    <section id="listen" className="section pt-12 md:pt-16">
      <div className="container-site">
        <div className="text-center" data-reveal>
          <p className="eyebrow justify-center">{t.eyebrow}</p>
          <h2 className="h2 mx-auto mt-4">{t.h2}</h2>
        </div>

        <div
          ref={ref}
          className="relative mt-12 overflow-hidden rounded-[32px] border border-border bg-bg-sunk px-4 pb-10 pt-8 md:mt-16 md:px-10 md:pb-14 md:pt-10"
          data-reveal
        >
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="seg" role="group" aria-label="Call language">
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

          <div className="mt-10 grid items-center justify-items-center gap-10 md:grid-cols-[1fr_auto_1fr] md:gap-6">
            <DeviceFrame dark time="8:04" className="max-w-[300px]">
              <div className="flex flex-1 flex-col px-5 pb-6 text-dark-ink" aria-label="Example: morning call transcript">
                <div className="mt-4 text-center">
                  <span className="mx-auto grid size-14 place-items-center rounded-full bg-accent font-deva text-xl text-white">
                    {content.nav.glyph}
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
                <div className="mt-4 flex justify-center gap-5" aria-hidden>
                  <span className="grid size-10 place-items-center rounded-full bg-white/10">
                    <MicOff className="size-4" strokeWidth={1.75} />
                  </span>
                  <span className="grid size-10 place-items-center rounded-full bg-act">
                    <PhoneOff className="size-4" strokeWidth={1.75} />
                  </span>
                  <span className="grid size-10 place-items-center rounded-full bg-white/10">
                    <Volume2 className="size-4" strokeWidth={1.75} />
                  </span>
                </div>
              </div>
            </DeviceFrame>

            <div className="flex flex-row items-center gap-3 text-[13px] text-ink-2 md:flex-col">
              <span className="h-px w-10 bg-border md:h-16 md:w-px" />
              <span className="rounded-full border border-border bg-bg-elevated px-3 py-1.5">{t.toYou}</span>
              <span className="h-px w-10 bg-border md:h-16 md:w-px" />
            </div>

            <DeviceFrame time="8:06" className="max-w-[300px]">
              <aside className="flex flex-1 flex-col" aria-label="Example: WhatsApp briefing">
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
