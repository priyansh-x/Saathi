"use client";

import Image from "next/image";
import { ArrowRight, Check, PhoneCall } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Crossfade } from "@/lib/crossfade";
import { content } from "@/lib/content";
import { useInView, usePrefersReducedMotion } from "@/lib/use-reveal";
import { MiniMark } from "./chrome";
import { Waveform } from "./kit";
import heroImg from "@/public/images/hero-maa-balcony.jpg";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export function Hero() {
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
    <section className="relative overflow-hidden pb-20 pt-8 md:pb-28 md:pt-16">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] bg-[radial-gradient(60%_50%_at_75%_20%,var(--paper-sunk),transparent_70%)]"
        aria-hidden
      />
      <div className="container-site grid items-center gap-12 lg:grid-cols-[1.02fr_1fr] lg:gap-16">
        <div>
          <h1 className="h1 rise" style={d(0)}>
            {t.h1a}
            <br />
            {t.h1bLead} {t.h1b} <span className="serif-line">{t.h1accent}</span>
          </h1>
          <p className="sub rise mt-6" style={d(160)}>
            {t.sub}
          </p>
          <div className="rise mt-8 flex flex-col gap-3 sm:flex-row" style={d(240)}>
            <a href="#join" className="btn">
              {t.cta}
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
            </a>
            <a href="#listen" className="btn-ghost">
              <PhoneCall className="size-4" strokeWidth={1.75} aria-hidden />
              {t.secondary}
            </a>
          </div>
          <ul className="rise mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-ink-2" style={d(320)}>
            {t.trust.map((x) => (
              <li key={x} className="flex items-center gap-1.5">
                <Check className="size-4 text-good" strokeWidth={2} aria-hidden />
                {x}
              </li>
            ))}
          </ul>
        </div>

        <div ref={ref} className="rise relative mx-auto w-full max-w-[600px] pt-2" style={d(200)}>
          <div className="art grain relative aspect-[4/3.2] shadow-[var(--shadow-mock)]">
            <Image
              src={heroImg}
              alt={t.imageAlt}
              fill
              priority
              placeholder="blur"
              sizes="(min-width: 1024px) 600px, 100vw"
              className="object-cover object-[70%_center]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-dark/25 via-transparent to-transparent" />

            <div
              className="float absolute bottom-4 left-3 right-3 w-auto max-w-[340px] rounded-[22px] border border-white/60 bg-bg-elevated/95 p-4 shadow-[var(--shadow-float)] backdrop-blur sm:right-auto"
              style={{ "--fd": "0s" } as CSSProperties}
            >
              <div className="flex items-center gap-3">
                <span className="ring-pulse grid size-10 shrink-0 place-items-center rounded-full bg-good text-good">
                  <PhoneCall className="size-4 text-white" strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold leading-tight">{t.callStatus}</p>
                  <p className="font-mono text-[12px] text-ink-3">
                    {t.callTitle} · {t.callClock}
                  </p>
                </div>
                <Waveform bars={9} className="text-ink-2" />
              </div>
              <div className="mt-3 rounded-[14px] bg-bg-sunk px-3 py-2.5">
                <p className={`text-[15px] leading-snug ${line.hi ? "font-deva" : ""}`}>
                  <Crossfade text={line.text} lang={line.hi ? "hi" : "en"} />
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-ink-3">{line.lang}</p>
              </div>
            </div>

            <div
              className="float absolute right-3 top-3 hidden w-[min(70%,240px)] rounded-[18px] rounded-tr-[6px] bg-wa-out p-3 text-[13px] leading-snug shadow-[var(--shadow-float)] sm:block"
              style={{ "--fd": "-3s" } as CSSProperties}
            >
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
