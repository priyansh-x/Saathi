"use client";

import { useEffect, useState } from "react";
import { demoMorningLines } from "@/lib/demo-lines";

export function MorningLines({ onDone }: { onDone?: () => void }) {
  const lines = demoMorningLines();
  const [shown, setShown] = useState(1);

  useEffect(() => {
    if (shown >= lines.length) {
      onDone?.();
      return;
    }
    const t = window.setTimeout(() => setShown((n) => n + 1), 2200);
    return () => window.clearTimeout(t);
  }, [shown, lines.length, onDone]);

  return (
    <ol className="mt-4 space-y-3">
      {lines.slice(0, shown).map((line, i) => (
        <li key={i} className="card px-4 py-3">
          <p className="font-devanagari text-[16px] leading-6">{line.hi}</p>
          <p className="mt-1 text-sm text-muted-foreground">{line.en}</p>
        </li>
      ))}
    </ol>
  );
}
