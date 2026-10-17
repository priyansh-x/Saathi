"use client";

import { Bell, Layout, MessageCircle, Mic, Minus, Phone, Plus, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Tick, WhatsAppBriefing } from "@/components/kit";
import { Crossfade } from "@/lib/crossfade";
import { content } from "@/lib/content";
import { useInView, usePrefersReducedMotion } from "@/lib/use-reveal";
import { Eyebrow } from "./chrome";
import { JoinButton } from "./waitlist";

const icons = { phone: Phone, mic: Mic, message: MessageCircle, chat: MessageCircle, bell: Bell, layout: Layout, users: Users };

export function HerWay() {
  const t = content.herWay;
  return (
    <section className="section pt-8">
      <div className="container-site">
        <h2 className="h2" data-reveal>
          {t.h3a}
          <br />
          <span className="serif-line">{t.h3b}</span>
        </h2>
        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible">
          {t.cards.map((c) => (
            <article key={c.name} className="mock-card min-w-[80%] snap-start p-5 md:min-w-0">
              <p className="text-[13px] text-ink-2">
                {c.name} · {c.lang} · {c.time}
              </p>
              <p className="font-deva mt-4 text-lg" lang="hi">
                {c.line}
              </p>
              <p className="example-tag mt-4">{t.tag}</p>
            </article>
          ))}
        </div>
        <p className="mt-2 text-sm text-ink-2">{t.caption}</p>
      </div>
    </section>
  );
}

export function Connect() {
  const t = content.connect;
  return (
    <section className="section">
      <div className="container-site">
        <Eyebrow n={t.eyebrowN} label={t.eyebrow} />
        <div className="mt-6 grid items-end gap-6 md:grid-cols-12">
          <h2 className="h2 md:col-span-7" data-reveal>
            {t.h2}
          </h2>
          <p className="sub md:col-span-5">{t.sub}</p>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-2 md:gap-0">
          <ul className="space-y-3 md:pr-10">
            <li className="font-medium">{t.maaTitle}</li>
            {t.maa.map((row) => {
              const Icon = icons[row.icon];
              return (
                <li key={row.text} className="flex gap-3 py-2">
                  <Icon className="size-5 text-ink-2" strokeWidth={1.5} />
                  {row.text}
                </li>
              );
            })}
          </ul>
          <ul className="space-y-3 border-t border-border pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-10">
            <li className="font-medium">{t.youTitle}</li>
            <li className="max-w-sm">
              <WhatsAppBriefing compact />
            </li>
            {t.you.map((row) => {
              const Icon = icons[row.icon];
              return (
                <li key={row.text} className="flex gap-3 py-2">
                  <Icon className="size-5 text-ink-2" strokeWidth={1.5} />
                  {row.text}
                </li>
              );
            })}
          </ul>
        </div>
        <ul className="mt-8 flex flex-wrap gap-4 text-sm">
          {t.trust.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <Tick />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Faq() {
  const t = content.faq;
  return (
    <section id="faq" className="section">
      <div className="container-site">
        <Eyebrow n={t.eyebrowN} label={t.eyebrow} />
        <div className="mt-6 grid items-start gap-8 md:grid-cols-12">
          <h2 className="h2 md:col-span-5">{t.h2}</h2>
          <div className="md:col-span-7">
            {t.items.map((item, i) => (
              <details key={item.q} className="group border-b border-border py-4" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
                  {item.q}
                  <Plus className="size-4 shrink-0 text-ink-2 group-open:hidden" strokeWidth={1.5} aria-hidden />
                  <Minus className="hidden size-4 shrink-0 text-ink-2 group-open:block" strokeWidth={1.5} aria-hidden />
                </summary>
                <p className="mt-2 text-[16px] leading-relaxed text-ink-2">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Finale() {
  const t = content.finale;
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced || !inView) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % t.prompts.length), 3200);
    return () => window.clearInterval(id);
  }, [inView, reduced, t.prompts.length]);

  return (
    <section className="dark-band section-finale bg-dark text-dark-ink" data-band="dark">
      <div className="container-site text-center">
        <h2 className="h2 mx-auto">
          {t.h2a}
          <br />
          <span className="serif-line">{t.h2b}</span>
        </h2>
        <div ref={ref} className="mx-auto mt-10 max-w-xl">
          <p className="min-h-[1.6em] text-dark-muted">
            <Crossfade text={t.prompts[reduced ? 0 : i]} />
          </p>
          <JoinButton className="btn mt-5 w-full md:w-auto">{t.cta}</JoinButton>
        </div>
      </div>
    </section>
  );
}

export function Sources() {
  return null;
}
