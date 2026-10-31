import type { Metadata } from "next";
import Link from "next/link";
import { Footer, Nav, SiteEffects, SkipLink } from "@/components/chrome";
import { content } from "@/lib/content";
import { familyDeskUrl } from "@/lib/desk";

export const metadata: Metadata = {
  title: `${content.thesisPage.title} · Saathi`,
  description: content.thesisPage.description,
};

export default function Thesis() {
  const t = content.thesisPage;
  const desk = familyDeskUrl();
  return (
    <>
      <SkipLink />
      <SiteEffects />
      <Nav deskUrl={desk} />
      <main id="main" className="pb-20 pt-32 md:pb-28 md:pt-40">
        <article className="container-site max-w-2xl">
          <p className="eyebrow">
            <span className="dot" />
            <span>{t.kicker}</span>
          </p>
          <h1 className="h1 mt-6 text-[clamp(2.6rem,6vw,4.2rem)]">{t.title}</h1>
          <div className="mt-10 space-y-6 text-[17px] leading-[1.7] text-ink-2 md:text-[18px]">
            {t.paragraphs.map((p) => (
              <p key={p.slice(0, 48)} className={p === "So voice is the interface." ? "font-medium text-ink" : undefined}>
                {p}
              </p>
            ))}
          </div>
          <section className="mt-14 border-t border-border pt-8">
            <h2 className="text-[15px] font-medium">{t.sourcesTitle}</h2>
            <ul className="mt-4 space-y-2 text-[14px]">
              {t.sources.map((s) => (
                <li key={s.href}>
                  <a href={s.href} className="text-accent underline-offset-4 hover:underline">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
          <p className="mt-12">
            <Link href="/" className="text-[15px] text-accent underline-offset-4 hover:underline">
              {t.back}
            </Link>
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}
