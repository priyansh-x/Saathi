"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { DeviceFrame, WhatsAppBriefing } from "@/components/kit";
import { LiveWave, clock, useMorningCall, waveHeights } from "@/components/call-demo";
import { SectionHead } from "@/components/chrome";
import { type CallLang } from "@/lib/call-audio";
import { content } from "@/lib/content";

const BARS = waveHeights(84, 11);

export function Listen() {
  const t = content.listen;
  const [lang, setLang] = useState<CallLang>("hi");
  const call = useMorningCall(lang);
  const { audioRef, playing, done, started, toggle, seek, seekLine, cue, index, time } = call;
  const progress = Math.min(1, time / cue.duration);

  return (
    <section id="listen" className="section">
      <audio ref={audioRef} preload="auto" />
      <div className="container-site">
        <SectionHead eyebrow={t.eyebrow} a={t.h2a} b={t.h2b} sub={t.sub} />

        <div
          className="dark-band grain mt-14 overflow-hidden rounded-[32px] shadow-[var(--shadow-lift)] md:mt-20"
          data-reveal
        >
          <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="flex flex-col p-5 sm:p-8 md:p-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="seg seg-dark max-w-full overflow-x-auto" role="group" aria-label="Call language">
                  {t.languages.map((l) => {
                    const id = l.live ? (l.id as CallLang) : null;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        disabled={!id}
                        aria-pressed={id === lang}
                        onClick={() => id && setLang(id)}
                        className="disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {l.label}
                        {!l.live ? <span className="text-[10px] uppercase tracking-wider">{t.soon}</span> : null}
                      </button>
                    );
                  })}
                </div>
                <p className="flex items-center gap-2 text-[13px] text-dark-muted">
                  <LiveWave live={playing} className="text-[#e8a27c]" />
                  {playing ? t.live : t.tag}
                </p>
              </div>

              <ol className="mt-8 space-y-1 md:mt-10" aria-label="Transcript">
                {cue.lines.map((row, i) => {
                  const state = !started ? (i === 0 ? "next" : "future") : i === index && !done ? "now" : i < index || done ? "past" : "future";
                  const maa = row.who === "maa";
                  return (
                    <li key={`${lang}-${i}`}>
                      <button
                        type="button"
                        onClick={() => seekLine(i)}
                        className={`group grid w-full grid-cols-[64px_1fr] gap-3 rounded-[16px] px-3 py-2.5 text-left transition-[background,opacity] duration-300 hover:bg-white/5 sm:grid-cols-[88px_1fr] ${
                          state === "now" ? "bg-white/6" : ""
                        } ${state === "future" ? "opacity-35" : state === "past" ? "opacity-60" : ""}`}
                      >
                        <span className="pt-1 leading-tight">
                          <span className={`block text-[12px] font-medium ${maa ? "text-[#e8a27c]" : "text-dark-ink"}`}>
                            {maa ? t.speakers.maa : t.speakers.saathi}
                          </span>
                          <span className="font-mono text-[11px] text-dark-muted">{clock(row.start)}</span>
                        </span>
                        <span lang={lang} className="text-[17px] leading-snug sm:text-[20px]">
                          {row.text}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-auto pt-8">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={toggle}
                    className="grid size-14 shrink-0 place-items-center rounded-full bg-accent text-white shadow-[0_10px_30px_-10px_rgba(176,83,42,0.9)] transition-transform hover:scale-105 active:scale-95"
                    aria-label={done ? t.replay : playing ? t.pause : t.play}
                  >
                    {done ? (
                      <RotateCcw className="size-5" strokeWidth={2} aria-hidden />
                    ) : playing ? (
                      <Pause className="size-5 fill-current" strokeWidth={1.5} aria-hidden />
                    ) : (
                      <Play className="ml-0.5 size-5 fill-current" strokeWidth={1.5} aria-hidden />
                    )}
                  </button>
                  <Scrubber
                    progress={progress}
                    duration={cue.duration}
                    onSeek={(r) => seek(r * cue.duration)}
                    chapters={t.chapters.map((c) => ({ label: c.label, at: cue.lines[c.line].start / cue.duration }))}
                  />
                  <span className="hidden w-[84px] shrink-0 text-right font-mono text-[12px] text-dark-muted sm:block">
                    {clock(time)} / {clock(cue.duration)}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative flex flex-col items-center justify-center gap-4 border-t border-white/8 bg-white/[0.02] px-6 py-10 lg:border-l lg:border-t-0">
              <p className="text-[13px] text-dark-muted">{t.toYou}</p>
              <DeviceFrame time="8:06" className="max-w-[260px]">
                <aside className="flex h-full min-h-0 flex-col overflow-hidden" aria-label="Example: WhatsApp briefing">
                  <WhatsAppBriefing landed={done} />
                </aside>
              </DeviceFrame>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Scrubber({
  progress,
  duration,
  onSeek,
  chapters,
}: {
  progress: number;
  duration: number;
  onSeek: (ratio: number) => void;
  chapters: { label: string; at: number }[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  function ratioAt(clientX: number) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return 0;
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    onSeek(ratioAt(e.clientX));
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (e.buttons !== 1) return;
    onSeek(ratioAt(e.clientX));
  }

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const stepR = 2 / duration;
    if (e.key === "ArrowRight") onSeek(Math.min(1, progress + stepR));
    else if (e.key === "ArrowLeft") onSeek(Math.max(0, progress - stepR));
    else return;
    e.preventDefault();
  }

  return (
    <div className="min-w-0 flex-1">
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label="Call position"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(progress * duration)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKey}
        className="relative flex h-12 cursor-pointer touch-none items-center gap-[2px] rounded-[8px]"
      >
        {BARS.map((h, i) => {
          const on = i / BARS.length < progress;
          return (
            <span
              key={i}
              className={`flex-1 rounded-full transition-colors duration-150 ${on ? "bg-[#e8a27c]" : "bg-white/15"}`}
              style={{ height: `${Math.round(h * 100)}%` }}
              aria-hidden
            />
          );
        })}
      </div>
      <div className="relative mt-1.5 h-4 text-[11px] text-dark-muted" aria-hidden>
        {chapters.map((c) => (
          <span key={c.label} className="absolute -translate-x-0 whitespace-nowrap" style={{ left: `${c.at * 100}%` }}>
            <span className="mr-1 inline-block h-2 w-px translate-y-[1px] bg-white/30" />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}
