"use client";

import Image from "next/image";
import { useState } from "react";
import { DeviceFrame, ExampleTag, StatusDot } from "@/components/kit";
import { content } from "@/lib/content";
import { Eyebrow } from "./chrome";
import neighbourImg from "@/public/images/neighbour-knock.jpg";

const tone = {
  good: "bg-good-soft text-good",
  look: "bg-look-soft text-look-ink",
  act: "bg-act-soft text-act",
} as const;

export function Answer() {
  const t = content.answer;
  const [tab, setTab] = useState(0);
  const cur = t.tabs[tab];

  return (
    <section id="how" className="section bg-bg-elevated">
      <div className="container-site">
        <Eyebrow label={t.eyebrow} />
        <div className="mt-6 grid items-start gap-14 lg:grid-cols-2">
          <div>
            <h2 className="h2" data-reveal>
              {t.h2a} {t.h2b}
            </h2>
            <p className="mt-5 text-[18px] text-ink-2">{t.just}</p>

            <div className="mt-10" data-reveal>
              <div className="seg" role="group" aria-label="Example states">
                {t.tabs.map((x, i) => (
                  <button key={x.id} type="button" aria-pressed={i === tab} onClick={() => setTab(i)}>
                    <StatusDot tone={x.id} />
                    {x.chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[320px]" data-reveal>
            <DeviceFrame className="relative mx-auto max-w-[280px]">
              <div
                key={cur.id}
                className="screen-fade flex h-full min-h-0 flex-col gap-2 overflow-hidden px-3 pb-3"
                aria-label="Example: family Today screen"
                aria-live="polite"
              >
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-[18px] font-semibold leading-tight">{t.header}</p>
                    <p className="text-[10.5px] text-ink-3">{t.date}</p>
                  </div>
                  <span className="text-[10.5px] text-ink-3">Example</span>
                </div>

                <div className={`rounded-[12px] p-3 ${tone[cur.id]}`}>
                  <p className="text-[12px] font-medium">{cur.chip}</p>
                  <p className="mt-1.5 text-[16px] font-semibold leading-snug text-ink">{cur.headline}</p>
                  <p className="mt-0.5 text-[12px] text-ink-2">{cur.detail}</p>
                  <span className="mt-2.5 flex h-9 items-center justify-center rounded-[8px] bg-accent text-[12.5px] font-medium text-white">
                    Call Maa
                  </span>
                  {cur.id === "act" ? <p className="mt-2 text-[10.5px] font-medium">{t.emergency}</p> : null}
                </div>

                <div className="rounded-[12px] border border-border bg-bg-elevated p-3">
                  <p className="text-[11px] text-ink-3">Medicines today</p>
                  <ul className="mt-1.5 space-y-1.5">
                    {cur.meds.map((m) => (
                      <li key={m.name} className="flex items-center justify-between text-[12.5px]">
                        <span>
                          {m.name} <span className="text-ink-3">· {m.slot}</span>
                        </span>
                        <span className={m.taken ? "text-good" : "text-look-ink"}>{m.taken ? "Taken" : "Missed"}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[12px] border border-border bg-bg-elevated p-3">
                  <p className="text-[11px] text-ink-3">In her words</p>
                  <p className="font-deva mt-1 text-[14px] leading-snug" lang="hi">
                    “{cur.quote}”
                  </p>
                </div>
              </div>
            </DeviceFrame>
            <ExampleTag className="mt-4 text-center" />
          </div>
        </div>

        <Features />
      </div>
    </section>
  );
}

function Features() {
  const t = content.answer;
  return (
    <div className="mt-20 grid gap-10 md:mt-24 md:grid-cols-2 md:items-center">
      <div data-reveal>
        <h3 className="text-[20px] font-semibold tracking-tight">{t.featuresTitle}</h3>
        <ul className="mt-6 space-y-5">
          {t.features.map((item) => (
            <li key={item.id}>
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
      <figure className="art relative aspect-[4/3]" data-reveal>
        <Image
          src={neighbourImg}
          alt={t.neighbourAlt}
          fill
          placeholder="blur"
          sizes="(min-width: 768px) 580px, 100vw"
          className="object-cover"
        />
        <figcaption className="absolute bottom-3 left-3 rounded-[8px] bg-bg-elevated px-3 py-2 text-[13px]">
          {t.neighbourBubble}
        </figcaption>
      </figure>
    </div>
  );
}
