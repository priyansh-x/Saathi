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

    const bands = document.querySelectorAll("[data-band='dark']");
    const io = new IntersectionObserver(
      (entries) => {
        const over = entries.some((e) => e.intersectionRatio > 0.2 && e.boundingClientRect.top < 80);
        document.documentElement.dataset.navDark = over ? "true" : "false";
      },
      { rootMargin: "-64px 0px -80% 0px", threshold: [0, 0.2, 1] },
    );
    bands.forEach((b) => io.observe(b));
    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
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
    <header className="site-nav sticky top-0 z-40 h-16 border-b border-transparent transition-[background,border-color] duration-[180ms]">
      <div className="container-site flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-medium">
          <LogoTile />
          <span>{t.logo}</span>
        </Link>
        <nav className="hidden items-center gap-7 text-[14px] md:flex" aria-label="Primary">
          {t.links.map((l) => (
            <a key={l.href} href={l.href} className="opacity-75 transition-opacity hover:opacity-100">
              {l.label}
            </a>
          ))}
        </nav>
        <a href={deskUrl} className="btn !min-h-9 !rounded-[8px] !px-3.5 text-[14px]">
          {t.cta}
        </a>
      </div>
    </header>
  );
}

export function Footer() {
  const t = content.footer;
  return (
    <footer className="border-t border-white/5 bg-dark text-dark-ink" data-band="dark">
      <div className="container-site grid gap-12 pb-10 pt-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <LogoTile />
            <span>{content.nav.logo}</span>
          </Link>
          <p className="mt-6 max-w-sm text-[18px] leading-relaxed text-dark-muted">
            {t.signA} {t.signB}
          </p>
        </div>
        <nav className="text-[14px] md:col-span-3 md:col-start-8" aria-label={t.productTitle}>
          <p className="font-medium">{t.productTitle}</p>
          <ul className="mt-4 space-y-2.5 text-dark-muted">
            {content.nav.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="hover:text-dark-ink">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <nav className="text-[14px] md:col-span-2" aria-label={t.companyTitle}>
          <p className="font-medium">{t.companyTitle}</p>
          <ul className="mt-4 space-y-2.5 text-dark-muted">
            <li>
              <Link href="/privacy" className="hover:text-dark-ink">
                {t.privacy}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-dark-ink">
                {t.terms}
              </Link>
            </li>
            <li>
              <a href={t.githubHref} className="hover:text-dark-ink">
                {t.github}
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="container-site relative flex flex-col gap-3 border-t border-white/10 py-6 text-[13px] text-dark-muted md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p>{t.copy}</p>
          <p>{t.credit}</p>
        </div>
        <p className="max-w-xl md:text-right">{t.disclaimer}</p>
      </div>
    </footer>
  );
}

export function Eyebrow({ label }: { label: string }) {
  return (
    <p className="eyebrow">
      <span className="rule" />
      <span>{label}</span>
    </p>
  );
}
