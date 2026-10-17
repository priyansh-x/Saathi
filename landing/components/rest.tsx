"use client";

import { Bell, Check, Layout, MessageCircle, Mic, Phone, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { content } from "@/lib/content";
import { Eyebrow } from "./chrome";
import { JoinButton } from "./waitlist";

const icons = { phone: Phone, mic: Mic, message: MessageCircle, chat: MessageCircle, bell: Bell, layout: Layout, users: Users };

export function HerWay() {
  const t = content.herWay;
  return (
    <section className="section pt-8">
      <div className="container-site">
        <h2 className="h2 max-w-4xl" data-reveal>
          {t.h3a}
          <br />
          <span className="accent-word">{t.h3b}</span>
        </h2>
        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible">
          {t.cards.map((c) => (
            <article key={c.name} className="min-w-[80%] snap-start rounded-[24px] border border-border bg-bg-elevated p-5 md:min-w-0">
              <p className="example-tag">{t.tag}</p>
              <p className="mt-3 text-xl font-medium">{c.name}</p>
              <p className="font-mono text-[12px] text-ink-2">
                {c.lang} · {c.time}
              </p>
              <p className="font-deva mt-4 text-lg" lang="hi">
                {c.line}
              </p>
              <p className="mt-4 text-sm text-ink-2">{t.caption}</p>
            </article>
          ))}
        </div>
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
          <p className="text-[18px] text-ink-2 md:col-span-5">{t.sub}</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <ul className="space-y-3">
            <li className="font-medium">{t.maaTitle}</li>
            {t.maa.map((row) => {
              const Icon = icons[row.icon];
              return (
                <li key={row.text} className="flex gap-3 rounded-2xl border border-border p-3">
                  <Icon className="size-5 text-accent" />
                  {row.text}
                </li>
              );
            })}
          </ul>
          <div className="grid place-items-center rounded-[28px] bg-dark p-8 text-center text-dark-ink">
            <p className="font-mono text-[11px] uppercase text-dark-accent">Saathi</p>
            <p className="mt-3 text-xl">{t.node}</p>
          </div>
          <ul className="space-y-3">
            <li className="font-medium">{t.youTitle}</li>
            {t.you.map((row) => {
              const Icon = icons[row.icon];
              return (
                <li key={row.text} className="flex gap-3 rounded-2xl border border-border p-3">
                  <Icon className="size-5 text-accent" />
                  {row.text}
                </li>
              );
            })}
          </ul>
        </div>
        <ul className="mt-8 flex flex-wrap gap-4 text-sm">
          {t.trust.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <Check className="size-4 text-good" />
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
                <summary className="cursor-pointer list-none text-lg font-medium">{item.q}</summary>
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
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % t.prompts.length), 2800);
    return () => window.clearInterval(id);
  }, [t.prompts.length]);

  return (
    <section className="dark-band section-finale bg-dark text-dark-ink" data-band="dark">
      <div className="container-site text-center">
        <svg className="mx-auto mb-12 h-8 w-full max-w-xl text-dark-ink/20" viewBox="0 0 400 24" aria-hidden>
          <path d="M0 12 Q 25 2 50 12 T 100 12 T 150 12 T 200 12 T 250 12 T 300 12 T 350 12 T 400 12" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
        <h2 className="h2 mx-auto max-w-4xl">
          {t.h2a}
          <br />
          <span className="accent-word">{t.h2b}</span>
        </h2>
        <div className="mx-auto mt-10 flex max-w-xl flex-col items-stretch gap-3 rounded-full border border-white/10 bg-dark-elevated p-2 md:flex-row md:items-center">
          <p className="flex-1 px-4 text-left text-dark-muted">{t.prompts[i]}</p>
          <JoinButton className="btn w-full md:w-auto">
            {t.cta} ↗
          </JoinButton>
        </div>
      </div>
    </section>
  );
}

export function Sources() {
  const notes = content.problem.notes;
  return (
    <section id="sources" className="border-t border-border py-10">
      <div className="container-site text-sm text-ink-2">
        <p className="font-mono text-[11px] uppercase">Sources</p>
        <ol className="mt-3 list-decimal space-y-1 pl-5">
          {notes.map((n) => (
            <li key={n.id}>
              <a className="underline-offset-2 hover:underline" href={n.href}>
                {n.text}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
