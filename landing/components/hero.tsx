"use client";

import { Phone } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Crossfade } from "@/lib/crossfade";
import { content } from "@/lib/content";
import { useInView, usePrefersReducedMotion } from "@/lib/use-reveal";
import { JoinButton } from "./waitlist";

export function Hero() {
  const t = content.hero;
  const count = process.env.NEXT_PUBLIC_WAITLIST_COUNT;
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const reduced = usePrefersReducedMotion();
  const line = t.voiceLines[reduced ? 0 : i];

  useEffect(() => {
    if (reduced || !inView) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % t.voiceLines.length), 4000);
    return () => window.clearInterval(id);
  }, [inView, reduced, t.voiceLines.length]);

  return (
    <section className="section pt-10 text-center md:pt-20">
      <div className="container-site">
        <p className="chip rise mx-auto" style={{ "--d": "0ms" } as CSSProperties}>
          {t.pill}
        </p>
        <h1 className="h1 rise mx-auto mt-6" style={{ "--d": "80ms" } as CSSProperties}>
          {t.h1a}
          <br />
          {t.h1bLead} {t.h1b.replace("every morning.", "")}
          <span className="accent-phrase">every morning.</span>
        </h1>
        <p className="sub rise mx-auto mt-6" style={{ "--d": "160ms" } as CSSProperties}>
          {t.sub}
        </p>
        <div className="rise mx-auto mt-8 max-w-md md:max-w-none" style={{ "--d": "240ms" } as CSSProperties}>
          <JoinButton className="btn w-full md:w-auto" />
        </div>
        <p className="rise mx-auto mt-4 max-w-xl text-[14px] text-ink-2" style={{ "--d": "320ms" } as CSSProperties}>
          {count ? `${count} families on the list · ` : null}
          {t.builtWith}
        </p>
        <p className="mt-1 text-[14px] text-ink-2">{t.buildathon}</p>

        <div
          ref={ref}
          className="rise mx-auto mt-14 flex h-[72px] max-w-xl items-center gap-3 rounded-full border border-border bg-bg-elevated px-3 py-2 text-left shadow-[var(--shadow-mock)] md:h-16"
          style={{ "--d": "400ms" } as CSSProperties}
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-bg" aria-hidden>
            <Phone className="size-4" strokeWidth={1.5} />
          </span>
          <p className={`min-w-0 flex-1 text-[15px] ${line.hi ? "font-deva" : ""}`}>
            <Crossfade text={line.text} lang={line.hi ? "hi" : "en"} />
          </p>
          <span className="shrink-0 text-[13px] text-ink-2">{line.lang === "HINDI" ? "Hindi" : line.lang === "ENGLISH" ? "English" : "Hinglish"}</span>
        </div>
      </div>
    </section>
  );
}
