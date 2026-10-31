"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { callAudio, lineAt, occupyAudio, type CallLang } from "@/lib/call-audio";
import { content } from "@/lib/content";
import { usePrefersReducedMotion } from "@/lib/use-reveal";

export function useMorningCall(lang: CallLang) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
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
    setStarted(false);
  }, [cue.src]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    let frame = 0;
    const tick = () => {
      setTime(el.currentTime);
      if (!el.paused) frame = requestAnimationFrame(tick);
    };
    const onPlay = () => {
      occupyAudio(el);
      setPlaying(true);
      setStarted(true);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tick);
    };
    const onPause = () => {
      setPlaying(false);
      setTime(el.currentTime);
    };
    const onEnded = () => {
      setPlaying(false);
      setTime(cue.duration);
    };
    const onSeek = () => setTime(el.currentTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("seeked", onSeek);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("seeked", onSeek);
    };
  }, [cue.duration]);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      return;
    }
    if (done) el.currentTime = 0;
    occupyAudio(el);
    void el.play();
  }

  function seek(t: number) {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(cue.duration - 0.1, t));
    setTime(el.currentTime);
    occupyAudio(el);
    void el.play();
  }

  function seekLine(i: number) {
    seek(cue.lines[i]?.start ?? 0);
  }

  return { audioRef, time, playing, started, done, index, line, cue, reduced, toggle, seek, seekLine };
}

export function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Deterministic bar heights so server and client render the same waveform. */
export function waveHeights(count: number, seed = 7) {
  return Array.from({ length: count }, (_, i) => {
    const v = Math.abs(Math.sin(i * 0.9 + seed) * 0.6 + Math.sin(i * 0.31 + seed * 2) * 0.4);
    return 0.22 + v * 0.78;
  });
}

export function LiveWave({
  live,
  bars = 5,
  className = "",
}: {
  live: boolean;
  bars?: number;
  className?: string;
}) {
  const heights = waveHeights(bars, 3);
  return (
    <span className={`inline-flex h-4 items-center gap-[3px] ${live ? "wave-live" : ""} ${className}`} aria-hidden>
      {heights.map((h, i) => (
        <span
          key={i}
          className="wave-bar w-[3px] rounded-full bg-current"
          style={{ height: `${Math.round(h * 100)}%`, "--bd": `${(i * 0.13) % 0.9}s` } as CSSProperties}
        />
      ))}
    </span>
  );
}

export function PlayButton({
  playing,
  done,
  onClick,
  className = "btn",
  labels,
}: {
  playing: boolean;
  done: boolean;
  onClick: () => void;
  className?: string;
  labels?: { play: string; pause: string; replay: string };
}) {
  const t = labels ?? content.listen;
  return (
    <button type="button" className={className} onClick={onClick}>
      {done ? (
        <>
          <RotateCcw className="size-4" strokeWidth={2} aria-hidden /> {t.replay}
        </>
      ) : playing ? (
        <>
          <Pause className="size-4 fill-current" strokeWidth={1.5} aria-hidden /> {t.pause}
        </>
      ) : (
        <>
          <Play className="size-4 fill-current" strokeWidth={1.5} aria-hidden /> {t.play}
        </>
      )}
    </button>
  );
}
