"use client";

import { useEffect, useRef, useState } from "react";
import { content, type LangId } from "@/lib/content";

export function Listen() {
  const t = content.listen;
  const [lang, setLang] = useState<LangId>("hi");
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const lines = t.transcripts[lang];

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const id = window.setTimeout(() => {
        setShown(lines.length);
        setDone(true);
      }, 0);
      return () => window.clearTimeout(id);
    }
    const el = ref.current;
    if (!el) return;
    let timer: number | undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) {
          if (timer) window.clearInterval(timer);
          return;
        }
        timer = window.setInterval(() => {
          setShown((n) => {
            if (n >= lines.length) {
              setDone(true);
              if (timer) window.clearInterval(timer);
              return n;
            }
            return n + 1;
          });
        }, 900);
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) window.clearInterval(timer);
    };
  }, [lines.length, lang]);

  return (
    <section className="section pt-4" data-reveal>
      <div className="container-site">
        <h2 className="h2 center mx-auto text-center">{t.h2}</h2>
        <div className="relative mx-auto mt-10 overflow-hidden rounded-[28px] border border-border bg-bg-elevated shadow-[var(--shadow-mock)] md:mt-14">
          <p className="example-tag absolute right-4 top-4 z-10">{t.tag}</p>
          <div className="grid md:grid-cols-2">
            <article ref={ref} className="bg-dark p-5 text-dark-ink md:p-8" aria-label="Example: morning call transcript">
              <div className="flex items-center justify-between font-mono text-[12px] text-dark-muted">
                <span className="flex items-center gap-2">
                  <span className="size-2 animate-[pulse-dot_1.4s_ease_infinite] rounded-full bg-[#7dce8a]" />
                  {t.onCall}
                </span>
                <span>{t.caller}</span>
              </div>
              <ol className="mt-6 space-y-3 text-[16px] leading-relaxed">
                {lines.slice(0, shown).map((line, idx) => (
                  <li key={idx} className={line.who === "maa" ? "font-serif italic text-dark-accent" : ""}>
                    <span className="mr-2 font-mono text-[11px] uppercase text-dark-muted">
                      {line.who === "saathi" ? "Saathi" : "Maa"}
                    </span>
                    <span lang="hi" className="font-deva">
                      {line.text}
                    </span>
                  </li>
                ))}
                {shown < lines.length ? <span className="caret" aria-hidden /> : null}
              </ol>
              <div className="mt-6 flex flex-wrap gap-2">
                {t.languages.map((l) => {
                  const id = (l.id === "hi" ? "hi" : l.id === "en" ? "en" : l.id === "hinglish" ? "hinglish" : null) as LangId | null;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      disabled={!l.live || !id}
                      onClick={() => {
                        if (!id) return;
                        setLang(id);
                        setShown(0);
                        setDone(false);
                      }}
                      className={`rounded-full px-3 py-1.5 text-sm ${
                        l.live && id === lang ? "bg-dark-ink text-ink" : "border border-white/15 text-dark-muted"
                      } disabled:opacity-50`}
                    >
                      {l.label}
                      {!l.live ? <span className="ml-1 font-mono text-[10px]">soon</span> : null}
                    </button>
                  );
                })}
              </div>
            </article>
            <aside className="flex items-center justify-center bg-bg p-5 md:p-8" aria-label="Example: WhatsApp briefing">
              <div className="w-full max-w-[320px] overflow-hidden rounded-[44px] border border-border bg-wa-bg shadow-[var(--shadow-mock)]">
                <div className="bg-wa-head px-4 py-3 text-sm text-white">Rohit</div>
                <div className="min-h-[280px] p-4">
                  {done ? (
                    <div className="animate-[fade-up_0.4s_var(--ease)] rounded-2xl bg-white p-3 text-[14px] leading-relaxed shadow-sm">
                      <p lang="hi">{t.briefing}</p>
                      <p className="mt-2 font-mono text-[11px] text-ink-2">{t.briefingMeta}</p>
                      <div className="mt-3 flex gap-2">
                        <span className="rounded-full border border-border px-3 py-1.5 text-xs">{t.openToday} ↗</span>
                        <span className="rounded-full border border-border px-3 py-1.5 text-xs">{t.messageMaa}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-ink-2">Waiting for the call to finish…</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
