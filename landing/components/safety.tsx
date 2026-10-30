import { content } from "@/lib/content";
import { Eyebrow } from "./chrome";

export function Safety() {
  const t = content.safety;
  return (
    <section id="safety" className="section">
      <div className="container-site">
        <Eyebrow label={t.eyebrow} />
        <h2 className="h2 mt-6" data-reveal>
          {t.h2}
        </h2>
        <p className="sub mt-4" data-reveal>
          {t.sub}
        </p>
        <div className="mt-12 grid gap-12 md:grid-cols-2">
          <article data-reveal>
            <h3 className="text-[20px] font-semibold tracking-tight">{t.emergencyTitle}</h3>
            <ol className="mt-5 space-y-3">
              {t.emergencySteps.map((step, i) => (
                <li key={step} className="flex gap-3 text-[16px] leading-relaxed text-ink-2">
                  <span className="w-4 shrink-0 text-ink-3">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </article>
          <article data-reveal>
            <h3 className="text-[20px] font-semibold tracking-tight">{t.missedTitle}</h3>
            <ol className="mt-5 space-y-3">
              {t.missedSteps.map((step, i) => (
                <li key={step} className="flex gap-3 text-[16px] leading-relaxed text-ink-2">
                  <span className="w-4 shrink-0 text-ink-3">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </article>
        </div>
        <p className="mt-10 max-w-xl text-[16px] font-medium">{t.disclaimer}</p>
      </div>
    </section>
  );
}
