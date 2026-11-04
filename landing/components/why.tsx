"use client";

import { DoorOpen, MessageCircle, PhoneMissed, Pill } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LiveWave } from "@/components/call-demo";
import { MiniMark, SectionHead } from "@/components/chrome";
import { content } from "@/lib/content";
import { useInView } from "@/lib/use-reveal";
import nightImg from "@/public/images/problem-night-child.jpg";

const icons = { wa: MessageCircle, phone: PhoneMissed, door: DoorOpen, meds: Pill } as const;

export function Why() {
  const t = content.why;
  return (
    <section id="why" className="dark-band grain section relative overflow-hidden" data-band="dark">
      <div
        className="pointer-events-none absolute left-1/2 top-[55%] -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(176,83,42,0.55), rgba(176,83,42,0))" }}
        aria-hidden
      />
      <div className="container-site">
        <div className="grid items-end gap-12 lg:grid-cols-[1.1fr_1fr]">
          <SectionHead eyebrow={t.eyebrow} a={t.h2a} b={t.h2b} sub={t.sub} />
          <figure className="art relative aspect-[4/3] bg-dark-2" data-reveal>
            <Image
              src={nightImg}
              alt={t.imageAlt}
              fill
              placeholder="blur"
              sizes="(min-width: 1024px) 520px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark/70 via-transparent to-transparent" aria-hidden />
            <figcaption className="absolute bottom-4 left-4 rounded-full bg-black/40 px-3 py-1.5 font-mono text-[12px] text-dark-ink backdrop-blur">
              11:42 PM
            </figcaption>
          </figure>
        </div>

        <ul className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 md:mt-20">
          {t.cards.map((c, i) => {
            const Icon = icons[c.id];
            return (
              <li
                key={c.id}
                className="slice group rounded-[24px] border border-white/8 bg-dark-2 p-6 transition-colors hover:border-white/15"
                data-reveal
                style={{ "--rd": `${i * 90}ms` } as CSSProperties}
              >
                <div className="flex items-center gap-2.5 text-[13px] text-dark-muted">
                  <span className="grid size-8 place-items-center rounded-full bg-white/6">
                    <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  {c.title}
                </div>
                <p className="mt-8 text-[20px] font-medium tracking-tight">
                  <span className="strike">{c.body}</span>
                </p>
                <p className="display mt-6 border-t border-white/8 pt-4 text-[21px] leading-snug text-dark-muted transition-colors group-hover:text-dark-ink">
                  {c.caption}
                </p>
              </li>
            );
          })}
        </ul>

        <div
          className="relative mt-3 overflow-hidden rounded-[28px] p-[1px]"
          style={{ background: "linear-gradient(120deg, rgba(232,162,124,0.7), rgba(224,154,58,0.25) 40%, rgba(255,255,255,0.06))" }}
          data-reveal
        >
          <div className="grid gap-8 rounded-[27px] bg-dark-2 p-6 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-10 md:p-10">
            <div className="flex items-center gap-3">
              <MiniMark className="size-11" />
              <div className="leading-tight">
                <p className="font-medium">{t.nodeTitle}</p>
                <p className="mt-0.5 text-[13px] text-dark-muted">{content.hero.example}</p>
              </div>
            </div>
            <blockquote>
              <p className="font-deva text-[clamp(1.5rem,3vw,2.25rem)] leading-snug" lang="hi">
                {t.nodeQuote}
              </p>
              <p className="mt-2 text-[15px] text-dark-muted">
                {t.nodeTranslit} <span className="opacity-70">· {t.nodeEn}</span>
              </p>
            </blockquote>
            <LiveWave live bars={9} className="hidden h-8 text-[#e8a27c] md:inline-flex" />
          </div>
        </div>
        <p className="display mt-8 text-center text-[22px] text-dark-muted md:text-[26px]" data-reveal>
          {t.close}
        </p>

        <dl className="mt-20 grid gap-10 border-t border-white/10 pt-12 md:mt-28 md:grid-cols-3">
          {t.facts.map((f, i) => (
            <div key={f.source} data-reveal style={{ "--rd": `${i * 100}ms` } as CSSProperties}>
              <dt className="sr-only">{f.source}</dt>
              <dd>
                <p className="display text-[64px] leading-none tracking-tight md:text-[84px]">
                  <CountUp value={f.value} />
                  <span className="text-[#e8a27c]">{f.suffix}</span>
                </p>
                <p className="mt-4 max-w-[28ch] text-[16px] leading-relaxed text-dark-muted">{f.body}</p>
                <a
                  href={f.href}
                  className="mt-3 inline-block text-[13px] text-dark-muted underline decoration-white/20 underline-offset-4 hover:text-dark-ink"
                >
                  {f.source}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, 0.01);
  const [n, setN] = useState(value);
  const ran = useRef(false);
  const decimals = Number.isInteger(value) ? 0 : 1;

  useEffect(() => {
    if (!inView || ran.current) return;
    ran.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const start = performance.now();
    const dur = 1800;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setN(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);

  return <span ref={ref}>{n.toFixed(decimals)}</span>;
}
