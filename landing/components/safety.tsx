import { content } from "@/lib/content";

export function Safety() {
  const t = content.safety;
  return (
    <section id="safety" className="section bg-bg-sunk">
      <div className="container-site">
        <div data-reveal>
          <h2 className="h2">{t.h2}</h2>
          <p className="sub mt-4">{t.sub}</p>
        </div>
        <div className="mt-12 grid gap-12 md:grid-cols-2">
          <article data-reveal>
            <h3 className="text-[22px] font-semibold tracking-tight">{t.emergencyTitle}</h3>
            <ol className="mt-5 space-y-4">
              {t.emergencySteps.map((step, i) => (
                <li key={step} className="flex gap-4 text-[16px] leading-relaxed text-ink-2">
                  <span className="w-5 shrink-0 text-ink-3">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </article>
          <article data-reveal>
            <h3 className="text-[22px] font-semibold tracking-tight">{t.missedTitle}</h3>
            <ol className="mt-5 space-y-4">
              {t.missedSteps.map((step, i) => (
                <li key={step} className="flex gap-4 text-[16px] leading-relaxed text-ink-2">
                  <span className="w-5 shrink-0 text-ink-3">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </article>
        </div>
        <p className="mt-12 max-w-xl text-[16px] font-medium" data-reveal>
          {t.disclaimer}
        </p>
      </div>
    </section>
  );
}
