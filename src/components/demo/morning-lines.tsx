"use client";

import { useCallback, useEffect, useState } from "react";
import { DemoAudio } from "@/components/demo/demo-audio";
import { recordCallLines, scaleLineTimes, visibleRecordLines } from "@/lib/demo-record";

export function MorningLines({ audioUrl = "", onDone }: { audioUrl?: string; onDone?: () => void }) {
  const timed = recordCallLines();
  const [shown, setShown] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const lines = durationMs ? scaleLineTimes(timed, durationMs) : timed;
  const onTime = useCallback((ms: number) => setElapsed(ms), []);
  const onDuration = useCallback((ms: number) => setDurationMs(ms), []);

  useEffect(() => {
    if (audioUrl) return;
    if (shown >= timed.length) {
      onDone?.();
      return;
    }
    const t = window.setTimeout(() => setShown((n) => n + 1), 2200);
    return () => window.clearTimeout(t);
  }, [shown, timed.length, onDone, audioUrl]);

  const visible = audioUrl ? visibleRecordLines(lines, elapsed) : timed.slice(0, shown);

  return (
    <>
      <DemoAudio url={audioUrl} playing={Boolean(audioUrl)} seekMs={elapsed} onTime={onTime} onDuration={onDuration} />
      <ol className="mt-4 space-y-3">
        {visible.map((line, i) => (
          <li key={i} className="card px-4 py-3">
            <p className="font-devanagari text-[16px] leading-6">{line.hi}</p>
            <p className="mt-1 text-sm text-muted-foreground">{line.en}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
