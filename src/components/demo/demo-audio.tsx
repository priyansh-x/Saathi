"use client";

import { useEffect, useRef } from "react";

/** Hidden player. Syncs currentTime to the transcript clock. No file is shipped in the repo. */
export function DemoAudio({
  url,
  playing,
  seekMs,
  onTime,
  onDuration,
}: {
  url: string;
  playing: boolean;
  seekMs: number;
  onTime?: (ms: number) => void;
  onDuration?: (ms: number) => void;
}) {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !url) return;
    const onMeta = () => onDuration?.(el.duration * 1000);
    const onTick = () => onTime?.(el.currentTime * 1000);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("timeupdate", onTick);
    return () => {
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("timeupdate", onTick);
    };
  }, [url, onDuration, onTime]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !url) return;
    if (playing) {
      const drift = Math.abs(el.currentTime * 1000 - seekMs);
      if (drift > 400) el.currentTime = Math.max(0, seekMs / 1000);
      void el.play().catch(() => undefined);
    } else {
      el.pause();
    }
  }, [playing, seekMs, url]);

  if (!url) return null;
  return <audio ref={ref} src={url} preload="metadata" className="sr-only" />;
}
