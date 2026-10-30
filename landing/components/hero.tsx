"use client";

import Image from "next/image";
import { DeviceFrame } from "@/components/kit";
import { CallScreen, PlayButton, useMorningCall } from "@/components/call-demo";
import { content } from "@/lib/content";
import heroImg from "@/public/images/hero-maa-balcony.jpg";

export function Hero({ deskUrl }: { deskUrl: string }) {
  const t = content.hero;
  const { audioRef, playing, done, toggle, cue, index, line } = useMorningCall("hi");
  const shown = done ? [...cue.lines] : playing ? cue.lines.slice(0, index) : [cue.lines[0]];
  const activeLine = playing ? line : null;

  return (
    <section className="pb-12 pt-8 md:pb-16 md:pt-12">
      <audio ref={audioRef} preload="auto" />
      <div className="container-site grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
        <div>
          <p className="eyebrow">
            <span className="rule" />
            <span>{t.kicker}</span>
          </p>
          <h1 className="h1 mt-4">{t.h1a} {t.h1b}</h1>
          <p className="sub mt-5">{t.sub}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <PlayButton playing={playing} done={done} onClick={toggle} />
            <a href={deskUrl} className="btn-ghost">
              {t.cta}
            </a>
          </div>
          <p className="mt-6 max-w-xl text-[14px] leading-relaxed text-ink-2">{t.trust.join(" · ")}</p>
        </div>

        <div className="relative mx-auto w-full max-w-[480px]">
          <div className="art relative aspect-[5/6] md:aspect-[3/4]">
            <Image
              src={heroImg}
              alt={t.imageAlt}
              fill
              priority
              placeholder="blur"
              sizes="(min-width: 1024px) 480px, 90vw"
              className="object-cover object-[72%_center]"
            />
            <div className="absolute bottom-5 right-4 w-[44%] max-w-[210px] sm:right-5">
              <DeviceFrame dark time="8:04">
                <CallScreen lang="hi" playing={playing} done={done} line={activeLine} shown={shown} />
              </DeviceFrame>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
