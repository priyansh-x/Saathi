import { ArrowRight, Clock, Lock, PauseCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { SectionHead } from "@/components/chrome";
import { content } from "@/lib/content";

const icons = { consent: ShieldCheck, family: Lock, stop: PauseCircle, retention: Clock } as const;

export function ThesisBand() {
  const t = content.thesisBand;
  return (
    <section id="thesis" className="section relative overflow-hidden bg-accent-soft/50">
      <div className="container-site max-w-4xl text-center">
        <p className="eyebrow mx-auto">
          <span className="dot" />
          <span>{t.kicker}</span>
        </p>
        <blockquote className="mt-8" data-reveal>
          <p className="display text-[clamp(3.2rem,9vw,7.5rem)] leading-[0.95] tracking-tight">
            <span className="text-accent">“</span>
            Voice is the <em>interface.</em>
            <span className="text-accent">”</span>
          </p>
        </blockquote>
        <p className="sub mx-auto mt-8 max-w-[52ch]" data-reveal>
          {t.body}
        </p>
        <p className="mt-8" data-reveal>
          <Link href="/thesis" className="btn-ghost">
            {t.cta}
            <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
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
        <SectionHead eyebrow={t.eyebrow} a={t.h2a} b={t.h2b} />
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 md:mt-20 lg:grid-cols-4">
          {t.items.map((item, i) => {
            const Icon = icons[item.id];
            return (
              <li
                key={item.id}
                className="card group p-6 transition-[transform,box-shadow] duration-500 ease-[var(--ease)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
                data-reveal
                style={{ "--rd": `${i * 80}ms` } as CSSProperties}
              >
                <span className="grid size-11 place-items-center rounded-[14px] bg-sage-soft text-sage transition-colors group-hover:bg-accent-soft group-hover:text-accent">
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <h3 className="mt-8 text-[18px] font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">{item.body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
