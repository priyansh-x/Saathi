"use client";

import { Check } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { DeviceFrame, WhatsAppBriefing } from "@/components/kit";
import { SectionHead } from "@/components/chrome";
import { content } from "@/lib/content";
import { usePrefersReducedMotion } from "@/lib/use-reveal";
import neighbourImg from "@/public/images/neighbour-knock.jpg";

const CYCLE_MS = 6500;

export function People() {
  const t = content.people;
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const [paused, setPaused] = useState(false);
  const running = auto && !paused && !reduced;

  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % t.items.length), CYCLE_MS);
    return () => window.clearTimeout(id);
  }, [running, active, t.items.length]);

  const cur = t.items[active];

  return (
    <section id="how" className="section">
      <div className="container-site">
        <SectionHead eyebrow={t.eyebrow} a={t.h2a} b={t.h2b} sub={t.sub} />

        <div
          className="mt-14 grid gap-6 md:mt-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <ol className="flex flex-col gap-3" role="tablist" aria-label={t.eyebrow}>
            {t.items.map((item, i) => {
              const on = i === active;
              return (
                <li key={item.id} role="presentation">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => {
                      setActive(i);
                      setAuto(false);
                    }}
                    className={`relative w-full overflow-hidden rounded-[24px] border p-6 text-left transition-[background,border-color,box-shadow] duration-300 ${
                      on
                        ? "border-border bg-bg-elevated shadow-[var(--shadow-mock)]"
                        : "border-transparent hover:bg-bg-elevated/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-3">
                        <span
                          className={`grid size-8 place-items-center rounded-full font-mono text-[12px] transition-colors ${
                            on ? "bg-accent text-white" : "bg-bg-sunk text-ink-3"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className={`text-[14px] font-medium ${on ? "text-accent" : "text-ink-3"}`}>{item.who}</span>
                      </span>
                      <span className="font-mono text-[12px] text-ink-3">{item.time}</span>
                    </div>
                    <p className={`display mt-4 text-[28px] leading-tight transition-colors ${on ? "text-ink" : "text-ink-2"}`}>
                      {item.title}
                    </p>
                    <div className="acc-body" data-open={on}>
                      <div>
                        <p className="pt-3 text-[15.5px] leading-relaxed text-ink-2">{item.body}</p>
                      </div>
                    </div>
                    {on && running ? (
                      <span className="absolute inset-x-6 bottom-0 h-[2px] overflow-hidden rounded-full bg-border" aria-hidden>
                        <span
                          key={active}
                          className="block h-full origin-left bg-accent"
                          style={{ animation: `grow ${CYCLE_MS}ms linear both` }}
                        />
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ol>

          <div
            className="relative min-h-[460px] overflow-hidden rounded-[28px] border border-border bg-bg-sunk md:min-h-[540px]"
            role="tabpanel"
            aria-live="polite"
          >
            <div key={cur.id} className="screen-fade absolute inset-0">
              {cur.id === "parent" ? <ParentStage /> : cur.id === "child" ? <ChildStage /> : <NeighbourStage />}
            </div>
            <ul className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
              {cur.points.map((p, i) => (
                <li
                  key={p}
                  className="pop-in flex items-center gap-1.5 rounded-full bg-bg-elevated/95 px-3 py-1.5 text-[13px] shadow-sm backdrop-blur"
                  style={{ animationDelay: `${150 + i * 90}ms` }}
                >
                  <Check className="size-3.5 text-good" strokeWidth={2.5} aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function ParentStage() {
  const t = content.people;
  return (
    <div
      className="flex h-full items-center justify-center pb-16"
      style={{ background: "radial-gradient(circle at 50% 42%, var(--sun-soft) 0%, var(--bg-sunk) 62%)" }}
    >
      <div className="relative">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute left-1/2 top-[30%] size-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/25"
            style={{ animation: `ring 3s var(--ease) ${i}s infinite` }}
            aria-hidden
          />
        ))}
        <div className="featurephone wiggle-soft relative">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/40" aria-hidden />
          <div className="featurephone-screen">
            <p className="text-[9px] opacity-70">08:00</p>
            <p className="mt-3 text-center text-[13px] font-bold">{t.phoneRing}</p>
            <p className="text-center text-[10px] opacity-80">{t.phoneSub}</p>
            <div className="mt-4 flex justify-between text-[9px] font-bold">
              <span>Answer</span>
              <span>Silence</span>
            </div>
          </div>
          <div className="featurephone-keys" aria-hidden>
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChildStage() {
  return (
    <div
      className="flex h-full items-start justify-center pt-8"
      style={{ background: "radial-gradient(circle at 50% 30%, #dcefe3 0%, var(--bg-sunk) 65%)" }}
    >
      <div className="w-[248px] translate-y-2">
        <DeviceFrame time="8:06">
          <WhatsAppBriefing />
        </DeviceFrame>
      </div>
    </div>
  );
}

function NeighbourStage() {
  const t = content.people;
  return (
    <div className="relative h-full">
      <Image
        src={neighbourImg}
        alt={t.neighbourAlt}
        fill
        placeholder="blur"
        sizes="(min-width: 1024px) 640px, 100vw"
        className="object-cover object-[60%_center]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" aria-hidden />
      <div className="pop-in absolute left-4 top-4 rounded-[16px] bg-bg-elevated/95 px-4 py-3 shadow-[var(--shadow-lift)] backdrop-blur">
        <p className="text-[11px] text-ink-3">WhatsApp · Example</p>
        <p className="mt-0.5 text-[14px] font-medium">{t.neighbourBubble}</p>
      </div>
    </div>
  );
}

export function HerWay() {
  const way = content.herWay;
  return (
    <section className="section pt-0 md:pt-0">
      <div className="container-site">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHead eyebrow={way.eyebrow} a={way.h3a} b={way.h3b} />
          <p className="sub max-w-[36ch] md:text-right" data-reveal>
            {way.sub}
          </p>
        </div>
        <div className="-mx-5 mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible">
          {way.cards.map((c, i) => (
            <article
              key={c.name}
              className="group card min-w-[82%] snap-start overflow-hidden transition-[transform,box-shadow] duration-500 ease-[var(--ease)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)] md:min-w-0"
              data-reveal
              style={{ "--rd": `${i * 90}ms` } as CSSProperties}
            >
              <div className="relative aspect-[5/4] overflow-hidden bg-bg-sunk">
                <Image
                  src={c.img}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 400px, 82vw"
                  className="object-cover transition-transform duration-700 ease-[var(--ease)] group-hover:scale-[1.04]"
                />
                <span className="absolute left-3 top-3 rounded-full bg-bg-elevated/95 px-3 py-1 text-[12px] font-medium backdrop-blur">
                  {c.lang} · {c.time}
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-black/30 px-2.5 py-1 text-[11px] text-white backdrop-blur">
                  {way.tag}
                </span>
              </div>
              <div className="p-6">
                <p className="text-[13px] text-ink-3">Saathi to {c.name}</p>
                <p className="display mt-2 text-[26px] leading-[1.15]" lang="hi">
                  “{c.line}”
                </p>
                <p className="mt-5 flex items-center justify-between border-t border-border pt-4 text-[13px] text-ink-3">
                  <span>Medicines</span>
                  <span className="font-medium text-ink-2">{c.meds}</span>
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
