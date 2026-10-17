"use client";

import { content } from "@/lib/content";
import { Eyebrow } from "./chrome";

export function Why() {
  const t = content.why;
  return (
    <section className="section">
      <div className="container-site">
        <Eyebrow n={t.eyebrowN} label={t.eyebrow} />
        <h2 className="h2 mt-6 max-w-4xl" data-reveal>
          {t.h2a}
          <br />
          <span className="accent-word">{t.h2b}</span>
        </h2>
        <div
          className="board relative mt-10 aspect-[16/9] overflow-hidden rounded-[28px] border border-border bg-[radial-gradient(circle,_rgba(46,42,38,.08)_1px,_transparent_1px)] bg-[length:18px_18px] shadow-[var(--shadow-mock)]"
          aria-label="Example: partial signals around one morning"
          data-reveal
        >
          <div className="board-pan absolute inset-0 grid grid-cols-2 grid-rows-2 gap-4 p-4 md:p-8" data-loop>
            {t.cards.map((c) => (
              <article key={c.title} className="rounded-2xl border border-border bg-bg-elevated p-4">
                <p className="font-mono text-[11px] uppercase text-ink-2">{c.title}</p>
                <p className="mt-2 text-xl font-medium">{c.body}</p>
              </article>
            ))}
          </div>
          <div className="absolute left-1/2 top-1/2 z-10 w-[min(70%,18rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-accent bg-bg-elevated p-4 text-center shadow-[var(--shadow-mock)]">
            <p className="font-mono text-[11px] uppercase text-accent">Saathi</p>
            <p className="font-deva mt-1 text-sm" lang="hi">
              {t.node}
            </p>
          </div>
        </div>
        <p className="mx-auto mt-4 w-fit rounded-full border border-border bg-bg-elevated px-3 py-1 font-mono text-[12px] text-ink-2">
          {t.captions[4]}
        </p>
        <p className="mt-6 text-[18px] text-ink-2">{t.close}</p>
      </div>
    </section>
  );
}
