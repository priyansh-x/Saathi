import { content } from "@/lib/content";
import { Eyebrow } from "./chrome";

export function Why() {
  const t = content.why;
  return (
    <section id="why" className="section">
      <div className="container-site">
        <Eyebrow label={t.eyebrow} />
        <h2 className="h2 mt-6" data-reveal>
          {t.h2a} {t.h2b}
        </h2>
        <ul className="mt-12 grid gap-10 md:grid-cols-2">
          {t.facts.map((fact) => (
            <li key={fact.source} data-reveal>
              <p className="text-[40px] font-semibold tracking-tight md:text-[48px]">{fact.stat}</p>
              <p className="mt-3 max-w-md text-[17px] leading-relaxed text-ink-2">{fact.body}</p>
              <a href={fact.href} className="mt-3 inline-block text-[14px] text-accent underline-offset-4 hover:underline">
                {fact.source}
              </a>
            </li>
          ))}
        </ul>
        <blockquote className="mt-16 max-w-2xl border-l-2 border-accent pl-5" data-reveal>
          <p className="font-deva text-[26px] leading-snug" lang="hi">
            {t.nodeQuote}
          </p>
          <p className="mt-2 text-[15px] text-ink-2">{t.nodeTranslit}</p>
          <p className="mt-4 text-[15px] text-ink-2">{t.close}</p>
        </blockquote>
      </div>
    </section>
  );
}
