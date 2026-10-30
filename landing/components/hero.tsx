"use client";

import Image from "next/image";
import { PhoneCall } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Crossfade } from "@/lib/crossfade";
import { content } from "@/lib/content";
import { useInView, usePrefersReducedMotion } from "@/lib/use-reveal";
import { MiniMark } from "./chrome";
import { Waveform } from "./kit";
import heroImg from "@/public/images/hero-maa-balcony.jpg";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export function Hero({ deskUrl }: { deskUrl: string }) {
  const t = content.hero;
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, 0.2);
  const reduced = usePrefersReducedMotion();
  const line = t.voiceLines[reduced ? 0 : i];

  useEffect(() => {
    if (reduced || !inView) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % t.voiceLines.length), 3800);
    return () => window.clearInterval(id);
  }, [inView, reduced, t.voiceLines.length]);

  return (
    <section className="pb-16 pt-8 md:pb-24 md:pt-14">
      <div className="container-site grid items-start gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <h1 className="h1 rise" style={d(0)}>
            {t.h1a} {t.h1b}
          </h1>
          <p className="sub rise mt-6" style={d(140)}>
            {t.sub}
          </p>
          <div className="rise mt-8 flex flex-col gap-3 sm:flex-row" style={d(220)}>
            <a href={deskUrl} className="btn">
              {t.cta}
            </a>
            <a href="#listen" className="btn-ghost">
              {t.secondary}
            </a>
          </div>
          <ul className="rise mt-8 space-y-1.5 text-[15px] text-ink-2" style={d(300)}>
            {t.trust.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>

        <div ref={ref} className="rise" style={d(180)}>
          <div className="art relative aspect-[4/3.1] shadow-[var(--shadow-mock)]">
            <Image
              src={heroImg}
              alt={t.imageAlt}
              fill
              priority
              placeholder="blur"
              sizes="(min-width: 1024px) 600px, 100vw"
              className="object-cover object-[70%_center]"
            />
            <div className="absolute bottom-3 left-3 right-3 max-w-[300px] rounded-[16px] border border-border bg-bg-elevated p-3.5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-good text-white">
                  <PhoneCall className="size-4" strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold leading-tight">{t.callStatus}</p>
                  <p className="font-mono text-[12px] text-ink-3">
                    {t.callTitle} · {t.callClock}
                  </p>
                </div>
                <Waveform bars={8} className="text-ink-2" />
              </div>
              <div className="mt-3 rounded-[12px] bg-bg-sunk px-3 py-2.5">
                <p className={`text-[15px] leading-snug ${line.hi ? "font-deva" : ""}`}>
                  <Crossfade text={line.text} lang={line.hi ? "hi" : "en"} />
                </p>
                <p className="mt-1 text-[11px] text-ink-3">
                  {t.example} · {line.lang}
                </p>
              </div>
            </div>
            <div className="absolute right-3 top-3 hidden max-w-[220px] rounded-[14px] bg-wa-out p-3 text-[13px] leading-snug sm:block">
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-wa-head">
                <MiniMark className="size-4" />
                Saathi · 8:06 AM
              </p>
              {t.briefingShort}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
