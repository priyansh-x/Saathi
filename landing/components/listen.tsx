"use client";

import { useEffect, useRef, useState } from "react";
import { ExampleTag, PhoneFrame, WhatsAppBriefing } from "@/components/kit";
import { content, type LangId } from "@/lib/content";
import { useInView, usePrefersReducedMotion } from "@/lib/use-reveal";

const CPS = 32;

export function Listen() {
  const t = content.listen;
  const [lang, setLang] = useState<LangId>("hi");
  const [turn, setTurn] = useState(0);
  const [chars, setChars] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);
  const reduced = usePrefersReducedMotion();
  const lines = t.transcripts[lang];
  const current = lines[Math.min(turn, lines.length - 1)];
  const liveLabel = t.languages.find((l) => l.id === lang)?.label ?? "Hindi";

  useEffect(() => {
    if (reduced) return;
    if (!inView) return;
    if (turn >= lines.length) return;
    const target = lines[turn]?.text.length ?? 0;
    if (chars < target) {
      const id = window.setTimeout(() => setChars((n) => n + 1), 1000 / CPS);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => {
      setTurn((n) => n + 1);
      setChars(0);
    }, 1200);
    return () => window.clearTimeout(id);
  }, [inView, reduced, turn, chars, lines]);

  function pick(id: LangId) {
    setLang(id);
    setTurn(reduced ? content.listen.transcripts[id].length : 0);
    setChars(0);
  }

  return (
    <section className="section pt-4" data-reveal>
      <div className="container-site">
        <h2 className="h2 mx-auto text-center">{t.h2}</h2>
        <div className="mt-10 rounded-[20px] bg-bg-sunk p-4 md:mt-14 md:p-8">
          <ExampleTag />
          <div className="mt-3 grid items-start gap-6 md:grid-cols-2">
            <div>
              <PhoneFrame>
                <article ref={ref} className="p-5 md:p-6" aria-label="Example: morning call transcript">
                  <p className="text-[15px] font-medium">Saathi</p>
                  <p className="font-mono mt-1 text-[13px] tracking-[0.06em] text-ink-2">
                    {liveLabel} · {t.callClock}
                  </p>
                  <ol className="mt-5 space-y-3 text-[15px] leading-relaxed">
                    {(reduced ? lines : lines.slice(0, turn)).map((line, idx) => (
                      <li key={idx}>
                        <p className="text-[12px] text-ink-2">{line.who === "saathi" ? "Saathi" : "Maa"}</p>
                        <p lang="hi" className={line.who === "maa" ? "font-serif italic text-ink" : "text-ink"}>
                          {line.text}
                        </p>
                      </li>
                    ))}
                    {!reduced && turn < lines.length && current ? (
                      <li>
                        <p className="text-[12px] text-ink-2">{current.who === "saathi" ? "Saathi" : "Maa"}</p>
                        <p lang="hi" className={current.who === "maa" ? "font-serif italic" : ""}>
                          {current.text.slice(0, chars)}
                          <span className="caret" aria-hidden />
                        </p>
                      </li>
                    ) : null}
                  </ol>
                </article>
              </PhoneFrame>
              <div className="mt-4 flex flex-wrap gap-2">
                {t.languages.map((l) => {
                  const id = (l.id === "hi" || l.id === "en" || l.id === "hinglish" ? l.id : null) as LangId | null;
                  const selected = Boolean(l.live && id === lang);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      disabled={!l.live || !id}
                      onClick={() => id && pick(id)}
                      className={`rounded-full px-3 py-1.5 text-sm ${
                        selected
                          ? "bg-accent-soft text-accent"
                          : "border border-border text-ink-2"
                      } disabled:opacity-50`}
                    >
                      {l.label}
                      {!l.live ? <span className="ml-1 text-[12px]">{t.soon}</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
            <aside aria-label="Example: WhatsApp briefing">
              <WhatsAppBriefing />
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
