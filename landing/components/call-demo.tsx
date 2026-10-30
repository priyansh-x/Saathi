"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MiniMark } from "@/components/chrome";
import { callAudio, lineAt, occupyAudio, type CallLang } from "@/lib/call-audio";
import { content } from "@/lib/content";
import { usePrefersReducedMotion } from "@/lib/use-reveal";

export function useMorningCall(lang: CallLang) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduced = usePrefersReducedMotion();
  const cue = callAudio[lang];
  const { index, line } = lineAt(lang, time);
  const done = time >= cue.duration - 0.05 && !playing;

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.src = cue.src;
    el.currentTime = 0;
    setTime(0);
    setPlaying(false);
  }, [cue.src]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setTime(el.currentTime);
    const onPlay = () => {
      occupyAudio(el);
      setPlaying(true);
    };
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setTime(cue.duration);
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [cue.duration]);

  function toggle() {
    const el = audioRef.current;
    if (!el || reduced) return;
    if (playing) {
      el.pause();
      return;
    }
    if (done) el.currentTime = 0;
    occupyAudio(el);
    void el.play();
  }

  function seekLine(i: number) {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = cue.lines[i]?.start ?? 0;
    occupyAudio(el);
    void el.play();
  }

  return { audioRef, time, playing, done, index, line, cue, reduced, toggle, seekLine };
}

export function CallScreen({
  lang,
  playing,
  done,
  line,
  shown,
}: {
  lang: CallLang;
  playing: boolean;
  done: boolean;
  line: { who: "saathi" | "maa"; text: string } | null;
  shown: readonly { who: "saathi" | "maa"; text: string }[];
}) {
  const t = content.listen;
  return (
    <div className="flex h-full min-h-0 flex-col px-4 pb-5 text-dark-ink" aria-label="Example: morning call">
      <div className="mt-3 text-center">
        <span className="mx-auto grid size-11 place-items-center">
          <MiniMark className="size-11" />
        </span>
        <p className="mt-2 text-[15px] font-medium">{t.caller}</p>
        <p className="font-mono text-[12px] text-dark-muted">{playing ? t.live : done ? t.callClock : t.ready}</p>
      </div>
      <ol className="mt-4 flex flex-1 flex-col justify-end gap-2 overflow-hidden text-[13px] leading-snug">
        {shown.slice(-4).map((row, idx) => (
          <Bubble key={`${lang}-${idx}-${row.text}`} who={row.who} text={row.text} />
        ))}
        {playing && line ? <Bubble who={line.who} text={line.text} active /> : null}
      </ol>
    </div>
  );
}

function Bubble({ who, text, active = false }: { who: "saathi" | "maa"; text: string; active?: boolean }) {
  const maa = who === "maa";
  return (
    <li className={`flex ${maa ? "justify-end" : "justify-start"} ${active ? "screen-fade" : ""}`}>
      <p
        lang="hi"
        className={`max-w-[85%] rounded-[12px] px-3 py-2 ${
          maa ? "rounded-br-[4px] bg-accent text-white" : "rounded-bl-[4px] bg-white/10 text-dark-ink"
        }`}
      >
        {text}
        {active ? <span className="caret" aria-hidden /> : null}
      </p>
    </li>
  );
}

export function PlayButton({
  playing,
  done,
  onClick,
  className = "btn",
}: {
  playing: boolean;
  done: boolean;
  onClick: () => void;
  className?: string;
}) {
  const t = content.listen;
  return (
    <button type="button" className={className} onClick={onClick}>
      {done ? (
        t.replay
      ) : playing ? (
        <>
          <Pause className="size-3.5" strokeWidth={2} aria-hidden /> {t.pause}
        </>
      ) : (
        <>
          <Play className="size-3.5 fill-current" strokeWidth={1.5} aria-hidden /> {t.play}
        </>
      )}
    </button>
  );
}
