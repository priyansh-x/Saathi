import Image from "next/image";
import { Check, Play } from "lucide-react";
import type { CSSProperties } from "react";
import { content } from "@/lib/content";
import { Eyebrow } from "./chrome";
import setupImg from "@/public/images/setup-child-phone.jpg";

export function Setup() {
  const t = content.setup;
  return (
    <section id="setup" className="section bg-bg-elevated">
      <div className="container-site">
        <Eyebrow label={t.eyebrow} />
        <div className="mt-6 grid items-end gap-6 md:grid-cols-12">
          <h2 className="h2 md:col-span-7" data-reveal>
            {t.h2a} {t.h2b}
          </h2>
          <div className="md:col-span-5" data-reveal>
            <p className="sub">{t.sub}</p>
            <div className="mt-4 flex gap-2">
              {t.phones.map((p) => (
                <span key={p} className="chip !pl-3">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-stretch">
          <div className="art relative min-h-[360px] lg:min-h-[560px]" data-reveal>
            <Image
              src={setupImg}
              alt={t.imageAlt}
              fill
              placeholder="blur"
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-cover object-[30%_center]"
            />
            <div className="absolute bottom-4 left-4 right-4 rounded-[16px] border border-border bg-bg-elevated p-4 sm:left-auto sm:w-[300px]">
              <p className="text-[13px] font-medium">{t.voiceTitle}</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-white">
                  <Play className="ml-0.5 size-3.5 fill-current" strokeWidth={1.5} aria-hidden />
                </span>
                <span className="flex h-7 flex-1 items-center gap-[2px]" aria-hidden>
                  {Array.from({ length: 30 }).map((_, i) => (
                    <span
                      key={i}
                      className={`flex-1 rounded-full ${i < 11 ? "bg-accent" : "bg-ink-3/40"}`}
                      style={{ height: `${6 + ((i * 37) % 20)}px` }}
                    />
                  ))}
                </span>
                <span className="font-mono text-[11px] text-ink-3">{t.voiceClock}</span>
              </div>
              <p className="mt-2 text-[12px] text-ink-3">{t.voiceBar}</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="mock-card p-5 md:p-6" data-reveal aria-label="Example: setup form">
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-semibold">Set up Maa&apos;s calls</p>
                <span className="text-[12px] text-ink-3">Example</span>
              </div>
              <dl className="mt-4 space-y-2.5">
                {t.form.map((row, i) => (
                  <div
                    key={row.label}
                    className="rounded-[14px] border border-border bg-bg px-3.5 py-2.5"
                    data-reveal
                    style={{ "--rd": `${i * 70}ms` } as CSSProperties}
                  >
                    <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-3">{row.label}</dt>
                    <dd className="mt-0.5 text-[15px]">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <ol className="mock-card grid gap-4 p-5 md:p-6" data-reveal>
              {t.steps.map((s, i) => {
                const done = s.state === "Done";
                const waiting = s.state === "Waiting";
                return (
                  <li key={s.label} className="flex items-center gap-3 text-[15px]">
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-medium ${
                        done ? "bg-good text-white" : waiting ? "border border-accent text-accent" : "border border-border text-ink-3"
                      }`}
                    >
                      {done ? <Check className="size-3.5" strokeWidth={2.5} aria-hidden /> : i + 1}
                    </span>
                    <span className={`flex-1 ${s.state ? "" : "text-ink-3"}`}>{s.label}</span>
                    {s.state ? (
                      <span className={`text-[12px] ${done ? "text-good" : "text-accent"}`}>{s.state}</span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
        <p className="mt-6 max-w-2xl text-[15px] text-ink-2">{t.consent}</p>
      </div>
    </section>
  );
}
