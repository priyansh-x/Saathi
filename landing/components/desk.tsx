"use client";

import Image from "next/image";
import { useState } from "react";
import { DeviceFrame, ExampleTag } from "@/components/kit";
import { content } from "@/lib/content";
import { Eyebrow } from "./chrome";

export function Desk({ exampleUrl }: { exampleUrl: string }) {
  const t = content.desk;
  const [tab, setTab] = useState(0);
  const shot = t.shots[tab];

  return (
    <section id="desk" className="section bg-bg-elevated">
      <div className="container-site grid items-start gap-12 lg:grid-cols-2">
        <div>
          <Eyebrow label={t.eyebrow} />
          <h2 className="h2 mt-6" data-reveal>
            {t.h2a} {t.h2b}
          </h2>
          <p className="sub mt-4" data-reveal>
            {t.sub}
          </p>
          <div className="seg mt-6" role="group" aria-label="Desk screens">
            {t.shots.map((s, i) => (
              <button key={s.id} type="button" aria-pressed={i === tab} onClick={() => setTab(i)}>
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-6">
            <a href={exampleUrl} className="font-medium text-accent underline-offset-4 hover:underline">
              {t.exampleCta}
            </a>
            <span className="ml-2 text-[14px] text-ink-2">{t.exampleNote}</span>
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[320px]" data-reveal>
          <DeviceFrame className="relative mx-auto" time="8:34">
            <div className="relative h-full min-h-0 bg-bg">
              <Image src={shot.src} alt={shot.alt} fill sizes="280px" className="object-cover object-top" />
            </div>
          </DeviceFrame>
          <ExampleTag className="mt-4 text-center" />
        </div>
      </div>
    </section>
  );
}
