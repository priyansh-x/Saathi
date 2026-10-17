"use client";

import { Phone } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { content } from "@/lib/content";
import { JoinButton } from "./waitlist";

export function Hero() {
  const t = content.hero;
  const count = process.env.NEXT_PUBLIC_WAITLIST_COUNT;
  const [i, setI] = useState(0);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % t.voiceLines.length), 4000);
    return () => window.clearInterval(id);
  }, [t.voiceLines.length]);
  const line = t.voiceLines[i];

  return (
    <section className="section pt-10 text-center md:pt-20">
      <div className="container-site">
        <p className="chip rise mx-auto" style={{ "--d": "0ms" } as CSSProperties}>
          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
          {t.pill}
        </p>
        <h1 className="h1 rise mx-auto mt-6 max-w-[15ch] md:max-w-4xl" style={{ "--d": "80ms" } as CSSProperties}>
          {t.h1a}
          <br />
          <span className="accent-word">
            {t.h1bLead} {t.h1b}
          </span>
        </h1>
        <p className="rise mx-auto mt-6 max-w-xl text-[18px] leading-[1.55] text-ink-2 md:text-[20px]" style={{ "--d": "160ms" } as CSSProperties}>
          {t.sub}
        </p>
        <div className="rise mx-auto mt-8 max-w-md md:max-w-none" style={{ "--d": "240ms" } as CSSProperties}>
          <JoinButton className="btn w-full md:w-auto" />
        </div>
        <p className="rise mt-4 flex items-center justify-center gap-2 text-sm text-ink-2" style={{ "--d": "320ms" } as CSSProperties}>
          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
          {count ? `${count} families on the list · ` : null}
          {t.buildathon}
        </p>

        <div className="rise mx-auto mt-14 flex max-w-xl items-center gap-3 rounded-full border border-border bg-bg-elevated px-3 py-2 text-left shadow-[var(--shadow-mock)]" style={{ "--d": "400ms" } as CSSProperties}>
          <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-accent text-white">
            <span className="ripple absolute inset-0 rounded-full border border-accent" aria-hidden />
            <Phone className="size-5" />
          </span>
          <p className={`min-w-0 flex-1 text-[15px] ${line.hi ? "font-deva" : ""}`} lang={line.hi ? "hi" : "en"}>
            {line.text}
          </p>
          <span className="font-mono text-[11px] tracking-wide text-ink-2">{line.lang}</span>
        </div>
        <p className="mt-10 font-mono text-[12px] uppercase tracking-[0.06em] text-ink-2">{t.builtWith}</p>
      </div>
    </section>
  );
}
