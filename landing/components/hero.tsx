"use client";

import { ArrowUpRight, Check, Pause, Phone, Play, Volume2 } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";
import { DeviceFrame } from "@/components/kit";
import { LiveWave, PlayButton, clock, useMorningCall } from "@/components/call-demo";
import { MiniMark } from "@/components/chrome";
import { content } from "@/lib/content";
import heroImg from "@/public/images/hero-maa-balcony.jpg";

export function Hero({ deskUrl }: { deskUrl: string }) {
  const t = content.hero;
  const call = useMorningCall("hi");
  const { audioRef, playing, started, done, toggle, time } = call;

  return (
    <section className="grain relative overflow-hidden pb-16 pt-28 md:pb-24 md:pt-36">
      <audio ref={audioRef} preload="auto" />
      <div
        className="pointer-events-none absolute -right-40 -top-40 -z-10 size-[720px] rounded-full opacity-70 blur-3xl"
        style={{ background: "radial-gradient(circle, #f6d7a8 0%, rgba(246,215,168,0) 65%)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-48 top-1/3 -z-10 size-[560px] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, #f3d9c9 0%, rgba(243,217,201,0) 65%)" }}
        aria-hidden
      />

      <div className="container-site grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <p className="eyebrow rise">
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-good/60" />
              <span className="relative size-2 rounded-full bg-good" />
            </span>
            <span>{t.kicker}</span>
          </p>
          <h1 className="h1 rise mt-7" style={{ "--d": "80ms" } as CSSProperties}>
            {t.h1a} <em>{t.h1b}</em>
          </h1>
          <p className="sub rise mt-7" style={{ "--d": "160ms" } as CSSProperties}>
            {t.sub}
          </p>
          <div className="rise mt-9 flex flex-col gap-3 sm:flex-row" style={{ "--d": "240ms" } as CSSProperties}>
            <PlayButton
              playing={playing}
              done={done}
              onClick={toggle}
              labels={{ play: t.cta, pause: t.ctaPlaying, replay: t.ctaDone }}
            />
            <a href={deskUrl} className="btn-ghost">
              {t.secondary}
              <ArrowUpRight className="size-4" strokeWidth={2} aria-hidden />
            </a>
          </div>
          <ul
            className="rise mt-9 flex flex-col gap-2.5 text-[14px] text-ink-2 sm:flex-row sm:flex-wrap sm:gap-x-6"
            style={{ "--d": "320ms" } as CSSProperties}
          >
            {t.trust.map((x) => (
              <li key={x} className="flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded-full bg-good-soft text-good">
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                </span>
                {x}
              </li>
            ))}
          </ul>
        </div>

        <div className="rise relative mx-auto w-full max-w-[560px]" style={{ "--d": "200ms" } as CSSProperties}>
          <div className="art relative aspect-[4/5] shadow-[var(--shadow-lift)] sm:aspect-[5/6]">
            <Image
              src={heroImg}
              alt={t.imageAlt}
              fill
              loading="eager"
              fetchPriority="high"
              placeholder="blur"
              sizes="(min-width: 1024px) 560px, 92vw"
              className="object-cover object-[78%_center]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" aria-hidden />

            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-bg-elevated/90 py-1.5 pl-2 pr-3 text-[12.5px] font-medium shadow-sm backdrop-blur sm:left-5 sm:top-5">
              <span className={`grid size-5 place-items-center rounded-full ${started ? "bg-good text-white" : "bg-accent text-white"}`}>
                <Phone className="size-3" strokeWidth={2.5} aria-hidden />
              </span>
              {started ? t.chip : t.incoming}
            </div>


            <div className="absolute bottom-4 right-4 w-[50%] max-w-[232px] sm:bottom-5 sm:right-5 sm:w-[44%]">
              <DeviceFrame dark time="8:04">
                <HeroCallScreen call={call} time={time} />
              </DeviceFrame>
            </div>

            {done ? (
              <div
                className="pop-in absolute left-4 right-4 top-16 rounded-[18px] bg-bg-elevated/95 p-3.5 shadow-[var(--shadow-lift)] backdrop-blur sm:left-5 sm:right-auto sm:top-20 sm:w-[56%]"
                role="status"
              >
                <div className="flex items-center gap-2 text-[11.5px] text-ink-3">
                  <span className="grid size-4 place-items-center rounded-[4px] bg-[#25d366]">
                    <Phone className="size-2.5 text-white" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="flex-1">{t.toastApp}</span>
                  <span>{t.example}</span>
                </div>
                <p className="mt-1.5 text-[13.5px] font-semibold">{t.toastFrom}</p>
                <p className="mt-0.5 text-[13.5px] leading-snug text-ink-2">{t.toast}</p>
              </div>
            ) : null}
          </div>
          {!started ? (
            <p className="mt-4 flex items-center justify-center gap-2 text-[13px] text-ink-3 lg:justify-end">
              <Volume2 className="size-4" strokeWidth={1.75} aria-hidden />
              {t.sound} · {t.example}
            </p>
          ) : (
            <p className="mt-4 text-center text-[13px] text-ink-3 lg:text-right">{t.example}</p>
          )}
        </div>
      </div>

      <Proof />
    </section>
  );
}

function HeroCallScreen({ call, time }: { call: ReturnType<typeof useMorningCall>; time: number }) {
  const t = content.hero;
  const { started, playing, done, toggle, cue, index } = call;

  if (!started) {
    return (
      <div className="flex h-full flex-col items-center px-3 pb-[12%] pt-[14%] text-dark-ink">
        <p className="text-[10px] uppercase tracking-[0.14em] text-dark-muted">{t.incoming}</p>
        <span className="relative mt-[18%] grid place-items-center rounded-[22%] text-accent">
          <span className="ring-pulse absolute inset-0 rounded-[22%]" aria-hidden />
          <MiniMark className="relative size-14" />
        </span>
        <p className="mt-4 text-[17px] font-medium">{t.caller}</p>
        <p className="text-[11px] text-dark-muted">{t.callee}</p>
        <div className="mt-auto flex w-full items-end justify-around">
          <span className="flex flex-col items-center gap-1.5 text-[10px] text-dark-muted" aria-hidden>
            <span className="grid size-11 place-items-center rounded-full bg-white/10">
              <Phone className="size-4 rotate-[135deg]" strokeWidth={2} />
            </span>
            {t.later}
          </span>
          <button type="button" onClick={toggle} className="flex flex-col items-center gap-1.5 text-[10px] text-dark-ink">
            <span className="relative grid size-11 place-items-center rounded-full bg-[#2fbf62] text-[#2fbf62]">
              <span className="ring-pulse absolute inset-0 rounded-full" aria-hidden />
              <Phone className="wiggle relative size-4 text-white" strokeWidth={2.25} />
            </span>
            {t.answer}
          </button>
        </div>
      </div>
    );
  }

  const lines = cue.lines.slice(0, done ? cue.lines.length : index + 1).slice(-3);
  return (
    <div className="flex h-full min-h-0 flex-col px-2.5 pb-3 text-dark-ink" aria-live="polite">
      <div className="mt-1 flex items-center gap-2 px-1">
        <MiniMark className="size-7" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[12px] font-medium">{t.caller}</p>
          <p className="font-mono text-[10px] text-dark-muted">{done ? `${t.ended} · ${clock(time)}` : clock(time)}</p>
        </div>
        <LiveWave live={playing} className="text-[#e8a27c]" />
      </div>
      <ol className="mt-2 flex min-h-0 flex-1 flex-col justify-end gap-1.5 overflow-hidden text-[11px] leading-snug">
        {lines.map((row, i) => {
          const maa = row.who === "maa";
          const active = !done && i === lines.length - 1;
          return (
            <li key={`${row.start}`} className={`screen-fade flex ${maa ? "justify-end" : "justify-start"}`}>
              <p
                lang="hi"
                className={`max-w-[88%] rounded-[12px] px-2.5 py-1.5 ${
                  maa ? "rounded-br-[4px] bg-accent text-white" : "rounded-bl-[4px] bg-white/10"
                } ${active ? "" : "opacity-70"}`}
              >
                {row.text}
              </p>
            </li>
          );
        })}
      </ol>
      <div className="mt-2.5 flex justify-center">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? content.listen.pause : content.listen.play}
          className="grid size-10 place-items-center rounded-full bg-white/12 transition-colors hover:bg-white/20"
        >
          {playing ? (
            <Pause className="size-4 fill-current" strokeWidth={1.5} aria-hidden />
          ) : (
            <Play className="size-4 fill-current" strokeWidth={1.5} aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}

function Proof() {
  const items = content.proof;
  return (
    <div className="marquee mt-20 overflow-hidden border-y border-border py-5 md:mt-28" aria-label="What Saathi does">
      <ul className="marquee-track">
        {[...items, ...items].map((x, i) => (
          <li
            key={i}
            aria-hidden={i >= items.length}
            className="flex shrink-0 items-center gap-10 pr-10 text-[15px] text-ink-2"
          >
            <span>{x}</span>
            <span className="text-accent" aria-hidden>
              ✺
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
