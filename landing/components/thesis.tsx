import Link from "next/link";
import { content } from "@/lib/content";

export function ThesisBand() {
  const t = content.thesisBand;
  return (
    <section id="thesis" className="section">
      <div className="container-site max-w-3xl">
        <p className="eyebrow">
          <span className="rule" />
          <span>{t.kicker}</span>
        </p>
        <h2 className="h2 mt-4 max-w-none">{t.title}</h2>
        <p className="mt-4 max-w-xl text-[18px] leading-relaxed text-ink-2">{t.body}</p>
        <p className="mt-6">
          <Link href="/thesis" className="font-medium text-accent underline-offset-4 hover:underline">
            {t.cta}
          </Link>
        </p>
      </div>
    </section>
  );
}

export function Privacy() {
  const t = content.privacy;
  return (
    <section id="privacy" className="section">
      <div className="container-site">
        <h2 className="h2" data-reveal>
          {t.h2}
        </h2>
        <ul className="mt-12 grid gap-10 md:grid-cols-2">
          {t.items.map((item) => (
            <li key={item.title} data-reveal>
              <h3 className="text-[20px] font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
