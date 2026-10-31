import { Check, Mic } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";
import { LiveWave } from "@/components/call-demo";
import { SectionHead } from "@/components/chrome";
import { content } from "@/lib/content";
import setupImg from "@/public/images/setup-child-phone.jpg";

export function Setup() {
  const t = content.setup;
  return (
    <section id="setup" className="section">
      <div className="container-site">
        <SectionHead eyebrow={t.eyebrow} a={t.h2a} b={t.h2b} sub={t.sub} />

        <div className="mt-14 grid gap-4 md:mt-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="art relative min-h-[380px] lg:min-h-[560px]" data-reveal>
            <Image
              src={setupImg}
              alt={t.imageAlt}
              fill
              placeholder="blur"
              sizes="(min-width: 1024px) 680px, 100vw"
              className="object-cover object-[30%_center]"
            />
            <div className="float absolute bottom-4 left-4 right-4 rounded-[20px] bg-bg-elevated/95 p-4 shadow-[var(--shadow-lift)] backdrop-blur sm:left-auto sm:right-5 sm:bottom-5 sm:w-[300px]">
              <p className="text-[13px] font-medium">{t.voiceTitle}</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-good text-white">
                  <Mic className="size-4" strokeWidth={2} aria-hidden />
                </span>
                <LiveWave live bars={22} className="h-6 flex-1 text-good/70" />
                <span className="font-mono text-[12px] text-ink-3">{t.voiceClock}</span>
              </div>
              <p className="mt-2 text-[12px] text-ink-3">{t.voiceBar}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="card p-6 md:p-7" data-reveal aria-label="Example: setup form">
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-semibold">{t.formTitle}</p>
                <span className="rounded-full bg-look-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-look-ink">
                  Example
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4">
                {t.form.map((row, i) => (
                  <div
                    key={row.label}
                    className={`border-b border-border py-3 last:border-0 ${i >= 3 ? "col-span-2" : i === 2 ? "col-span-2 sm:col-span-1" : ""}`}
                  >
                    <dt className="text-[12px] text-ink-3">{row.label}</dt>
                    <dd className="mt-0.5 text-[15px]">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <ol className="card flex-1 p-6 md:p-7" data-reveal style={{ "--rd": "100ms" } as CSSProperties}>
              {t.steps.map((s, i) => (
                <li key={s.label} className="relative flex gap-4 pb-5 last:pb-0">
                  {i < t.steps.length - 1 ? (
                    <span
                      className={`absolute bottom-0 left-[13px] top-8 w-[2px] rounded-full ${s.state === "done" ? "bg-good" : "bg-border"}`}
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className={`relative grid size-7 shrink-0 place-items-center rounded-full text-[12px] ${
                      s.state === "done"
                        ? "bg-good text-white"
                        : s.state === "now"
                          ? "border-2 border-accent bg-accent-soft text-accent"
                          : "border-2 border-border text-ink-3"
                    }`}
                  >
                    {s.state === "done" ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : i + 1}
                    {s.state === "now" ? (
                      <span className="absolute inset-[-5px] animate-ping rounded-full border border-accent/40" aria-hidden />
                    ) : null}
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className={`text-[15.5px] font-medium ${s.state === "next" ? "text-ink-3" : ""}`}>{s.label}</span>
                      <span
                        className={`text-[11.5px] ${
                          s.state === "done" ? "text-good" : s.state === "now" ? "text-accent" : "text-ink-3"
                        }`}
                      >
                        {t.states[s.state]}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[13.5px] text-ink-2">{s.body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
