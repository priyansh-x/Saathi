import { CheckCheck, PhoneIncoming, PhoneMissed } from "lucide-react";
import type { CSSProperties } from "react";
import { Waveform } from "@/components/kit";
import { content } from "@/lib/content";
import { Eyebrow, MiniMark } from "./chrome";

function Strip() {
  return (
    <div className="grid w-fit grid-cols-5 gap-1.5 rounded-[12px] bg-[#e9e2d8] p-2 ring-1 ring-black/5" aria-hidden>
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className={`grid size-5 place-items-center rounded-full ${i < 3 ? "bg-bg-elevated shadow-[inset_0_-2px_0_rgba(0,0,0,0.08)]" : "border border-dashed border-ink-3/40"}`}
        >
          {i < 3 ? <span className="h-1.5 w-3 rounded-full bg-[#f3d9c9]" /> : null}
        </span>
      ))}
    </div>
  );
}

function Window() {
  return (
    <div className="relative h-[76px] w-[88px] rounded-[10px] bg-dark p-1.5" aria-hidden>
      <div className="grid h-full grid-cols-2 gap-1">
        <span className="rounded-[4px] bg-[#f4c27a] shadow-[0_0_18px_rgba(244,194,122,0.7)]" />
        <span className="rounded-[4px] bg-[#f4c27a]/85" />
        <span className="rounded-[4px] bg-[#f4c27a]/85" />
        <span className="rounded-[4px] bg-[#f4c27a]" />
      </div>
    </div>
  );
}

export function Why() {
  const t = content.why;
  const visuals = [
    <div key="wa" className="w-full rounded-[14px] bg-wa-bg p-2.5">
      <div className="flex items-center gap-2">
        <span className="size-7 rounded-full bg-[#d9cbb9]" aria-hidden />
        <span>
          <span className="block text-[13px] font-medium">Maa</span>
          <span className="block text-[11px] text-ink-3">{t.cards[0].body}</span>
        </span>
      </div>
      <p className="ml-auto mt-2 w-fit rounded-[10px] bg-wa-out px-2.5 py-1 text-[12px]">
        All ok? <CheckCheck className="inline size-3.5 text-ink-3" strokeWidth={2} aria-hidden />
      </p>
    </div>,
    <ul key="calls" className="w-full divide-y divide-border rounded-[14px] border border-border bg-bg text-[13px]">
      {[
        { icon: PhoneMissed, label: "Maa", time: "9:40", miss: true },
        { icon: PhoneMissed, label: "Maa", time: "19:10", miss: true },
        { icon: PhoneIncoming, label: "Office", time: "18:02", miss: false },
      ].map((c, i) => (
        <li key={i} className="flex items-center gap-2 px-3 py-1.5">
          <c.icon className={`size-3.5 ${c.miss ? "text-act" : "text-ink-3"}`} strokeWidth={2} aria-hidden />
          <span className={`flex-1 ${c.miss ? "text-act" : ""}`}>{c.label}</span>
          <span className="font-mono text-[11px] text-ink-3">{c.time}</span>
        </li>
      ))}
    </ul>,
    <div key="light" className="flex items-center gap-3">
      <Window />
      <p className="rounded-[12px] rounded-bl-[4px] bg-bg px-3 py-2 text-[13px] ring-1 ring-border">{t.cards[2].body}</p>
    </div>,
    <div key="strip" className="flex items-center gap-3">
      <Strip />
      <span className="text-[13px] text-ink-2">{t.cards[3].body}</span>
    </div>,
  ];

  return (
    <section id="why" className="section">
      <div className="container-site">
        <Eyebrow n={t.eyebrowN} label={t.eyebrow} />
        <h2 className="h2 mt-6" data-reveal>
          {t.h2a}
          <br />
          <span className="serif-line accent-phrase">{t.h2b}</span>
        </h2>

        <div className="relative mt-12 md:mt-16" aria-label="Example: partial signals around one morning">
          <svg
            className="draw pointer-events-none absolute inset-0 hidden h-full w-full text-accent/40 lg:block"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {["M 30 25 C 40 25, 40 50, 50 50", "M 30 75 C 40 75, 40 50, 50 50", "M 70 25 C 60 25, 60 50, 50 50", "M 70 75 C 60 75, 60 50, 50 50"].map((d, i) => (
              <path
                key={d}
                d={d}
                pathLength={1}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeDasharray="1"
                vectorEffect="non-scaling-stroke"
                style={{ "--i": i } as CSSProperties}
              />
            ))}
          </svg>

          <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.1fr_1fr] lg:grid-rows-2 lg:gap-x-16 lg:gap-y-6">
            {t.cards.map((c, i) => (
              <article
                key={c.title}
                className={`mock-card lift flex flex-col gap-4 p-5 ${
                  ["lg:col-start-1 lg:row-start-1", "lg:col-start-1 lg:row-start-2", "lg:col-start-3 lg:row-start-1", "lg:col-start-3 lg:row-start-2"][i]
                }`}
                data-reveal
                style={{ "--rd": `${i * 90}ms` } as CSSProperties}
              >
                <p className="text-[13px] font-medium text-ink-2">{c.title}</p>
                <div className="flex min-h-[78px] items-center">{visuals[i]}</div>
                <p className="serif-line text-[18px] text-ink-3">{t.captions[i]}</p>
              </article>
            ))}

            <article
              className="relative flex flex-col justify-center overflow-hidden rounded-[28px] bg-dark p-7 text-dark-ink shadow-[var(--shadow-float)] sm:col-span-2 lg:col-span-1 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:p-9"
              data-reveal
              style={{ "--rd": "360ms" } as CSSProperties}
            >
              <div className="halo pointer-events-none absolute inset-0 opacity-70" aria-hidden />
              <div className="relative">
                <p className="flex items-center gap-2 text-[13px] text-dark-muted">
                  <MiniMark className="size-6" />
                  {t.nodeTitle}
                </p>
                <Waveform bars={16} className="mt-6 text-accent" />
                <p className="font-deva mt-5 text-[26px] leading-snug lg:text-[30px]" lang="hi">
                  {t.nodeQuote}
                </p>
                <p className="mt-2 text-[14px] italic text-dark-muted">{t.nodeTranslit}</p>
                <p className="mt-8 border-t border-white/10 pt-4 text-[13px] text-dark-muted">Heard in her own words, every morning.</p>
              </div>
            </article>
          </div>
        </div>

        <p className="mt-10 max-w-xl text-[18px] text-ink-2" data-reveal>
          {t.close}
        </p>
      </div>
    </section>
  );
}
