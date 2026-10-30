"use client";

import Link from "next/link";
import { useEffect } from "react";
import { content } from "@/lib/content";
import { MARK_GLYPH, MARK_PATH, MARK_TILE } from "@/lib/mark-path";
import { useReveal } from "@/lib/use-reveal";

export function SiteEffects() {
  useReveal();
  useEffect(() => {
    const onScroll = () => {
      document.documentElement.dataset.scrolled = window.scrollY > 8 ? "true" : "false";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return null;
}

export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-bg"
    >
      {content.nav.skip}
    </a>
  );
}

export function LogoTile({ size = "size-8" }: { size?: string }) {
  return (
    <span className={`inline-grid ${size} place-items-center`} aria-hidden>
      <svg viewBox="0 0 512 512" className="h-full w-full">
        <rect width="512" height="512" rx="112" fill={MARK_TILE} />
        <path fill={MARK_GLYPH} d={MARK_PATH} />
      </svg>
    </span>
  );
}

export function MiniMark({ className = "size-4" }: { className?: string }) {
  return <LogoTile size={className} />;
}

export function Nav({ deskUrl }: { deskUrl: string }) {
  const t = content.nav;
  return (
    <header className="site-nav sticky top-0 z-40 h-16 border-b border-transparent bg-bg">
      <div className="container-site flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-medium">
          <LogoTile />
          <span>{t.logo}</span>
        </Link>
        <nav className="hidden items-center gap-7 text-[15px] md:flex" aria-label="Primary">
          {t.links.map((l) => (
            <a key={l.href} href={l.href} className="text-ink-2 hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>
        <a href={deskUrl} className="btn !min-h-10 !px-4 text-[14px]">
          {t.cta}
        </a>
      </div>
    </header>
  );
}

export function Footer() {
  const t = content.footer;
  return (
    <footer className="border-t border-border bg-bg">
      <div className="container-site grid gap-10 py-16 md:grid-cols-12">
        <div className="md:col-span-6">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <LogoTile />
            <span>{content.nav.logo}</span>
          </Link>
          <p className="mt-5 max-w-sm text-[22px] leading-snug text-ink-2">{t.sign}</p>
        </div>
        <nav className="text-[15px] md:col-span-3" aria-label="Product">
          <ul className="space-y-2.5 text-ink-2">
            {content.nav.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="hover:text-ink">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <nav className="text-[15px] md:col-span-3" aria-label="Company">
          <ul className="space-y-2.5 text-ink-2">
            <li>
              <Link href="/privacy" className="hover:text-ink">
                {t.privacy}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-ink">
                {t.terms}
              </Link>
            </li>
            <li>
              <a href={t.githubHref} className="hover:text-ink">
                {t.github}
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="container-site flex flex-col gap-3 border-t border-border py-6 text-[13px] text-ink-2 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p>{t.copy}</p>
          <p>{t.credit}</p>
        </div>
        <p className="max-w-xl md:text-right">{t.disclaimer}</p>
      </div>
    </footer>
  );
}
