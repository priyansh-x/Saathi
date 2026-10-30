import { content } from "@/lib/content";

export function People() {
  const t = content.people;
  return (
    <section id="people" className="section">
      <div className="container-site">
        <div data-reveal>
          <h2 className="h2">{t.h2}</h2>
          <p className="sub mt-4">{t.sub}</p>
        </div>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {t.items.map((item) => (
            <li key={item.who} className="border-t border-border pt-6" data-reveal>
              <p className="kicker">{item.who}</p>
              <h3 className="mt-3 text-[22px] font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{item.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-14" data-reveal>
          <h3 className="text-[18px] font-semibold">{t.toolsTitle}</h3>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {t.tools.map((tool) => (
              <li key={tool.title}>
                <p className="font-medium">{tool.title}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{tool.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
