"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useEffect } from "react";
import { content } from "@/lib/content";
import { useReveal } from "@/lib/use-reveal";
import { Waves } from "./rest";

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

export function LogoTile({ size = "size-8", text = "text-sm", dark = false }: { size?: string; text?: string; dark?: boolean }) {
  return (
    <span
      className={`grid ${size} place-items-center rounded-[10px] font-deva ${text} ${dark ? "bg-accent text-white" : "bg-accent text-white shadow-[0_6px_14px_-8px_rgba(142,63,29,0.8)]"}`}
      aria-hidden
    >
      {content.nav.glyph}
    </span>
  );
}

export function Nav() {
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
        <a href="#join" className="btn !min-h-10 !px-4 text-[14px]">
          {t.cta}
        </a>
      </div>
    </header>
  );
}

export function Footer() {
  const t = content.footer;
  const notes = content.problem.notes;
  const product = content.nav.links;
  return (
    <footer className="relative overflow-hidden border-t border-white/5 bg-dark text-dark-ink" data-band="dark">
      <Waves className="pointer-events-none absolute inset-x-0 -top-6 h-24 w-full text-dark-ink opacity-60" accentIndex={-1} />
      <div className="container-site relative grid gap-12 pb-10 pt-20 md:grid-cols-12">
        <div className="md:col-span-5">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <LogoTile dark />
            <span>{content.nav.logo}</span>
          </Link>
          <p className="serif-line mt-6 text-[28px] leading-tight md:text-[34px]">
            {t.signA}
            <br />
            <span className="text-[#e9a27e]">{t.signB}</span>
          </p>
          <a
            href={`mailto:${t.email}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[14px] text-dark-muted transition-colors hover:text-dark-ink"
          >
            <Mail className="size-4" strokeWidth={1.5} aria-hidden />
            {t.emailLabel}
          </a>
        </div>
        <nav className="text-[14px] md:col-span-2 md:col-start-7" aria-label={t.productTitle}>
          <p className="font-medium">{t.productTitle}</p>
          <ul className="mt-4 space-y-2.5 text-dark-muted">
            {product.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="hover:text-dark-ink">
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <a href="#join" className="hover:text-dark-ink">
                {content.nav.cta}
              </a>
            </li>
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
              <a href={`mailto:${t.email}`} className="hover:text-dark-ink">
                {t.emailLabel}
              </a>
            </li>
          </ul>
        </nav>
        <div id="sources" className="text-[14px] md:col-span-2">
          <p className="font-medium">{t.sources}</p>
          <ul className="mt-4 space-y-2.5 text-dark-muted">
            {notes.map((n) => (
              <li key={n.id}>
                <a className="hover:text-dark-ink" href={n.href} rel="noreferrer" target="_blank">
                  {n.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="container-site relative flex flex-col gap-3 border-t border-white/10 py-6 text-[13px] text-dark-muted md:flex-row md:items-center md:justify-between">
        <span>{t.copy}</span>
        <span className="max-w-2xl md:text-right">{t.disclaimer}</span>
      </div>
    </footer>
  );
}

export function Eyebrow({ n, label }: { n: string; label: string }) {
  return (
    <p className="eyebrow">
      <span className="n">{n}</span>
      <span className="rule" />
      <span>{label}</span>
    </p>
  );
}
