import { CheckCheck } from "lucide-react";
import { content } from "@/lib/content";
import { Eyebrow } from "./chrome";

function Strip() {
  return (
    <div className="mt-3 flex gap-1" aria-hidden>
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className={`h-7 w-4 rounded-[4px] border border-border ${i < 3 ? "bg-ink-2" : "bg-bg"}`}
        />
      ))}
    </div>
  );
}

export function Why() {
  const t = content.why;
  const artefacts = [
    {
      title: t.cards[0].title,
      body: t.cards[0].body,
      visual: (
        <p className="mt-3 flex items-center gap-1 text-[15px] text-ink-2">
          {t.cards[0].body}
          <CheckCheck className="size-4" strokeWidth={1.5} />
        </p>
      ),
    },
    {
      title: t.cards[1].title,
      body: t.missedRow,
      visual: <p className="mt-3 text-[15px]">{t.missedRow}</p>,
    },
    {
      title: t.cards[2].title,
      body: t.cards[2].body,
      visual: (
        <p className="mt-3 max-w-[14rem] rounded-[12px] border border-border bg-bg px-3 py-2 text-[15px]">
          {t.cards[2].body}
        </p>
      ),
    },
    {
      title: t.cards[3].title,
      body: t.stripLabel,
      visual: (
        <>
          <Strip />
          <p className="mt-2 text-[15px]">{t.stripLabel}</p>
        </>
      ),
    },
  ];

  return (
    <section className="section">
      <div className="container-site">
        <Eyebrow n={t.eyebrowN} label={t.eyebrow} />
        <h2 className="h2 mt-6" data-reveal>
          {t.h2a}
          <br />
          <span className="serif-line">{t.h2b}</span>
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Example: partial signals around one morning">
          {artefacts.map((c) => (
            <article key={c.title} className="mock-card p-4">
              <p className="text-[14px] text-ink-2">{c.title}</p>
              {c.visual}
            </article>
          ))}
        </div>
        <article className="mock-card mt-3 p-5">
          <p className="text-[14px] text-ink-2">{t.nodeTitle}</p>
          <p className="font-deva mt-2 text-xl" lang="hi">
            {t.node.split(" · ")[0]}
          </p>
          <p className="mt-2 text-sm text-ink-2">{t.captions[4]}</p>
        </article>
        <p className="mt-6 text-[18px] text-ink-2">{t.close}</p>
      </div>
    </section>
  );
}
