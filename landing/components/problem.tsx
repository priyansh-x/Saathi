import { content } from "@/lib/content";
import { Eyebrow } from "./chrome";

export function Problem() {
  const t = content.problem;
  return (
    <section id="problem" className="section">
      <div className="container-site">
        <Eyebrow n={t.eyebrowN} label={t.eyebrow} />
        <div className="mt-6 grid items-end gap-6 md:grid-cols-12">
          <h2 className="h2 md:col-span-7" data-reveal>
            {t.h2a}
            <br />
            <span className="serif-line">{t.h2b}</span>
          </h2>
          <p className="sub md:col-span-5">{t.sub}</p>
        </div>
        <p className="mt-4 max-w-2xl text-sm text-ink-2">{t.whyNow}</p>

        <ol className="mt-10 grid gap-x-10 md:mt-14 md:grid-cols-2" aria-label="Example: a night of unanswered questions">
          {t.notifications.map((note, i) => (
            <li key={note} className="flex items-baseline justify-between gap-4 border-b border-border py-3">
              <span className="text-[20px] leading-snug text-ink">{note}</span>
              <span className="shrink-0 text-[14px] text-ink-2">{t.times[i]}</span>
            </li>
          ))}
        </ol>
        <p className="example-tag mt-4">{t.caption}</p>
      </div>
      <p className="h2 mx-auto mt-20 px-5 text-center" data-reveal>
        {t.closerA}
        <br />
        <span className="serif-line">{t.closerB}</span>
      </p>
    </section>
  );
}
