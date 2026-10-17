"use client";

import { AlertTriangle, Phone, PhoneMissed, Siren } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Tick, WhatsAppBriefing } from "@/components/kit";
import { content } from "@/lib/content";
import { useInView, usePrefersReducedMotion } from "@/lib/use-reveal";
import { Eyebrow } from "./chrome";

const icons = [Phone, Phone, PhoneMissed, AlertTriangle, Phone, Siren];

export function Safety() {
  const t = content.safety;
  const [mode, setMode] = useState<"left" | "right">("left");
  const list = useRef<HTMLOListElement>(null);
  const inView = useInView(list);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const root = list.current;
    if (!root) return;
    const items = [...root.querySelectorAll<HTMLElement>(".safety-step")];
    if (reduced || !inView) {
      items.forEach((el) => el.setAttribute("data-in", ""));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.setAttribute("data-in", "");
        }
      },
      { threshold: 0.35 },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [inView, reduced]);

  const rightPane = (
    <div>
      <p className="font-medium">{t.rightTitle}</p>
      <ol ref={list} className="relative mt-4 space-y-0 text-sm">
        <span className="absolute top-2 bottom-2 left-[7px] w-px bg-border" aria-hidden />
        {t.steps.map((s, i) => {
          const Icon = icons[i] ?? Phone;
          const look = s.includes("Needs a look");
          const act = s.includes("Act now");
          return (
            <li
              key={s}
              className={`safety-step relative flex gap-3 py-3 pl-6 ${
                look ? "border-l-[3px] border-look-line bg-look-soft/60 text-look-ink" : ""
              } ${act ? "border-l-[3px] border-act bg-act-soft/70 text-act" : ""}`}
            >
              <Icon className="absolute top-3.5 left-0 size-4 text-ink-2" strokeWidth={1.5} aria-hidden />
              <span>
                {look || act ? <span className="mr-2 font-medium">{look ? "Needs a look" : "Act now"}</span> : null}
                {s}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 space-y-2 text-sm">
        <p className="flex items-center gap-2">
          <Tick />
          {t.going.replace("✅ ", "")}
        </p>
        <p className="flex items-center gap-2">
          <Tick />
          {t.clear.replace("✅ ", "")}
        </p>
      </div>
      <p className="example-tag mt-4">{t.caption}</p>
    </div>
  );

  const leftPane = (
    <div>
      <p className="font-medium">{t.leftTitle}</p>
      <div className="mt-4">
        <WhatsAppBriefing compact />
      </div>
      <p className="mt-4 text-ink-2">{t.leftCaption}</p>
    </div>
  );

  return (
    <section id="safety" className="section">
      <div className="container-site">
        <Eyebrow n={t.eyebrowN} label={t.eyebrow} />
        <h2 className="h2 mt-6 w-full max-w-none" data-reveal>
          {t.h2a} <span className="serif-line">{t.h2b}</span>
        </h2>
        <p className="sub mt-4">{t.sub}</p>

        <div className="mt-8 flex gap-2 md:hidden">
          <button type="button" className={`rounded-full px-3 py-2 text-sm ${mode === "left" ? "bg-ink text-bg" : "border border-border"}`} onClick={() => setMode("left")}>
            {t.leftTitle}
          </button>
          <button type="button" className={`rounded-full px-3 py-2 text-sm ${mode === "right" ? "bg-ink text-bg" : "border border-border"}`} onClick={() => setMode("right")}>
            {t.rightTitle}
          </button>
        </div>
        <div className="mt-6 grid gap-10 md:grid-cols-2">
          <div className={mode === "left" ? "block" : "hidden md:block"}>{leftPane}</div>
          <div className={mode === "right" ? "block" : "hidden md:block"}>{rightPane}</div>
        </div>
        <p className="mt-6 max-w-3xl text-[16px] text-ink-2">{t.disclaimer}</p>
      </div>
    </section>
  );
}
