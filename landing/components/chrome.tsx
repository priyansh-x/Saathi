"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useEffect } from "react";
import { content } from "@/lib/content";
import { useReveal } from "@/lib/use-reveal";
import { JoinButton } from "./waitlist";

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
        const over = entries.some((e) => e.isIntersecting && e.intersectionRatio > 0.2 && e.boundingClientRect.top < 80);
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

export function Nav() {
  const t = content.nav;
  return (
    <header className="site-nav sticky top-0 z-40 h-16 border-b border-transparent transition-[background,border-color] duration-250">
      <div className="container-site flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-medium">
          <span className="grid size-8 place-items-center rounded-lg bg-accent font-deva text-white" aria-hidden>
            {t.glyph}
          </span>
          <span>{t.logo}</span>
        </Link>
        <nav className="hidden items-center gap-6 text-[15px] md:flex" aria-label="Primary">
          {t.links.map((l) => (
            <a key={l.href} href={l.href} className="text-current/80 hover:text-current">
              {l.label}
            </a>
          ))}
        </nav>
        <JoinButton className="btn !min-h-11 px-4 text-[15px]" />
      </div>
    </header>
  );
}

export function Footer() {
  const t = content.footer;
  return (
    <footer className="border-t border-border bg-bg">
      <div className="container-site flex flex-col gap-10 py-16 md:flex-row md:items-end md:justify-between">
        <p className="font-serif text-3xl italic leading-tight text-ink md:text-4xl">
          {t.signA}
          <br />
          <span className="accent-word">{t.signB}</span>
        </p>
        <a
          href={`mailto:${t.email}`}
          className="grid size-12 place-items-center rounded-full border border-border"
          aria-label={`Email ${t.email}`}
        >
          <Mail className="size-5" />
        </a>
      </div>
      <div className="container-site flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border py-6 text-sm text-ink-2">
        <span className="flex items-center gap-2 font-medium text-ink">
          <span className="grid size-6 place-items-center rounded-md bg-accent font-deva text-[11px] text-white">स</span>
          {t.copy}
        </span>
        <Link href="/privacy">{t.privacy}</Link>
        <Link href="/terms">{t.terms}</Link>
        <span>{t.built}</span>
        <a href="#sources">{t.sources}</a>
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
