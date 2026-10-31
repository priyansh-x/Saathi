"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { content } from "@/lib/content";
import { MARK_GLYPH, MARK_PATH, MARK_TILE } from "@/lib/mark-path";
import { useReveal } from "@/lib/use-reveal";
import { useWaitlist } from "./waitlist";

export function SiteEffects() {
  useReveal();
  useEffect(() => {
    const onScroll = () => {
      document.documentElement.dataset.scrolled = window.scrollY > 24 ? "true" : "false";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const bands = document.querySelectorAll("[data-band='dark']");
    const io = new IntersectionObserver(
      (entries) => {
        const over = entries.some((e) => e.isIntersecting);
        document.documentElement.dataset.navDark = over ? "true" : "false";
      },
      { rootMargin: "-36px 0px -95% 0px" },
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
  const { open } = useWaitlist();
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5">
      <div className="site-nav-inner mx-auto flex h-14 max-w-[76rem] items-center justify-between gap-4 rounded-full pl-4 pr-2 sm:pl-5">
        <Link href="/" className="flex items-center gap-2.5 text-[17px] font-semibold tracking-tight">
          <LogoTile size="size-8" />
          <span>{t.logo}</span>
        </Link>
        <nav className="hidden items-center gap-1 text-[14px] lg:flex" aria-label="Primary">
          {t.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 opacity-75 transition-[opacity,background] hover:bg-current/5 hover:opacity-100"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <a
            href={deskUrl}
            className="hidden items-center gap-1 rounded-full px-3.5 py-2 text-[14px] opacity-75 transition-opacity hover:opacity-100 sm:inline-flex"
          >
            {t.desk}
            <ArrowUpRight className="size-3.5" strokeWidth={2} aria-hidden />
          </a>
          <button type="button" onClick={open} className="btn btn-sm">
            {t.cta}
          </button>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full lg:hidden"
            aria-label={menu ? t.close : t.menu}
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
          >
            {menu ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>
      {menu ? (
        <nav
          className="pop-in mx-auto mt-2 max-w-[76rem] rounded-[24px] border border-border bg-bg-elevated p-3 text-ink shadow-[var(--shadow-lift)] lg:hidden"
          aria-label="Mobile"
        >
          {t.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenu(false)}
              className="block rounded-[14px] px-4 py-3 text-[17px] hover:bg-bg-sunk"
            >
              {l.label}
            </Link>
          ))}
          <a href={deskUrl} className="flex items-center gap-1 rounded-[14px] px-4 py-3 text-[17px] text-accent hover:bg-bg-sunk">
            {t.desk}
            <ArrowUpRight className="size-4" aria-hidden />
          </a>
        </nav>
      ) : null}
    </header>
  );
}

export function Footer() {
  const t = content.footer;
  return (
    <footer className="dark-band relative overflow-hidden" data-band="dark">
      <div className="container-site grid gap-12 pb-10 pt-20 md:grid-cols-12">
        <div className="md:col-span-5">
          <Link href="/" className="flex items-center gap-2.5 text-[17px] font-semibold">
            <LogoTile />
            <span>{content.nav.logo}</span>
          </Link>
          <p className="display mt-6 max-w-sm text-[30px] leading-[1.1]">
            {t.signA} <em>{t.signB}</em>
          </p>
        </div>
        <nav className="text-[14px] md:col-span-3 md:col-start-8" aria-label={t.productTitle}>
          <p className="font-medium">{t.productTitle}</p>
          <ul className="mt-4 space-y-2.5 text-dark-muted">
            {content.nav.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-dark-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav className="text-[14px] md:col-span-2" aria-label={t.companyTitle}>
          <p className="font-medium">{t.companyTitle}</p>
          <ul className="mt-4 space-y-2.5 text-dark-muted">
            <li>
              <Link href="/thesis" className="transition-colors hover:text-dark-ink">
                {t.thesis}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="transition-colors hover:text-dark-ink">
                {t.privacy}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="transition-colors hover:text-dark-ink">
                {t.terms}
              </Link>
            </li>
            <li>
              <a href={t.githubHref} className="transition-colors hover:text-dark-ink">
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
      <p
        className="font-deva pointer-events-none -mb-[4vw] select-none text-center text-[34vw] font-medium leading-[1] text-[#25211c] md:text-[22vw]"
        lang="hi"
        aria-hidden
      >
        {t.wordmark}
      </p>
    </footer>
  );
}

export function Eyebrow({ label, className = "" }: { label: string; className?: string }) {
  return (
    <p className={`eyebrow ${className}`}>
      <span className="dot" />
      <span>{label}</span>
    </p>
  );
}

export function SectionHead({
  eyebrow,
  a,
  b,
  sub,
  className = "",
  center = false,
}: {
  eyebrow: string;
  a: string;
  b?: string;
  sub?: string;
  className?: string;
  center?: boolean;
}) {
  return (
    <div className={`${center ? "mx-auto flex flex-col items-center text-center" : ""} ${className}`}>
      <Eyebrow label={eyebrow} />
      <h2 className={`h2 mt-6 ${center ? "mx-auto" : ""}`} data-reveal>
        {a}
        {b ? (
          <>
            {" "}
            <em>{b}</em>
          </>
        ) : null}
      </h2>
      {sub ? (
        <p className={`sub mt-6 ${center ? "mx-auto" : ""}`} data-reveal style={{ "--rd": "80ms" } as React.CSSProperties}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}
