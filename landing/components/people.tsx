import Image from "next/image";
import type { CSSProperties } from "react";
import { content } from "@/lib/content";

export function People() {
  const t = content.people;
  const way = content.herWay;
  return (
    <>
      <section id="people" className="section">
        <div className="container-site">
          <h2 className="h2" data-reveal>
            {t.h2a} {t.h2b}
          </h2>
          <p className="sub mt-4" data-reveal>
            {t.sub}
          </p>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {t.items.map((item) => (
              <li key={item.who} className="border-t border-border pt-6" data-reveal>
                <p className="text-[13px] font-medium text-accent">{item.who}</p>
                <h3 className="mt-2 text-[22px] font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section pt-0">
        <div className="container-site">
          <h2 className="h2" data-reveal>
            {way.h3a} {way.h3b}
          </h2>
          <div className="-mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-3 md:overflow-visible">
            {way.cards.map((c, i) => (
              <article
                key={c.name}
                className="mock-card min-w-[82%] snap-start overflow-hidden md:min-w-0"
                data-reveal
                style={{ "--rd": `${i * 90}ms` } as CSSProperties}
              >
                <div className="relative aspect-[5/4] bg-bg-sunk">
                  <Image src={c.img} alt="" fill sizes="(min-width: 768px) 380px, 82vw" className="object-cover" />
                  <span className="absolute left-3 top-3 rounded-full bg-bg-elevated px-2.5 py-1 text-[12px] font-medium">
                    {c.lang} · {c.time}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-[13px] text-ink-3">Saathi to {c.name}</p>
                  <p className="font-deva mt-2 rounded-[14px] rounded-tl-[4px] bg-bg-sunk px-3.5 py-2.5 text-[17px]" lang="hi">
                    {c.line}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap justify-between gap-2 text-[13px] text-ink-3">
            <span>{way.caption}</span>
            <span>{way.tag}</span>
          </div>
        </div>
      </section>
    </>
  );
}
