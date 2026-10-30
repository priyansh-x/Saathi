import type { CSSProperties } from "react";
import { MiniMark } from "@/components/chrome";
import { DeviceFrame, ExampleTag, Waveform, WhatsAppBriefing } from "@/components/kit";
import { content } from "@/lib/content";

export function Hero({ deskUrl }: { deskUrl: string }) {
  const t = content.hero;
  return (
    <section className="pb-16 pt-10 md:pb-24 md:pt-16">
      <div className="container-site grid items-start gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
        <div className="min-w-0">
          <h1 className="h1 rise">{t.h1}</h1>
          <p className="sub rise mt-6" style={{ "--d": "120ms" } as CSSProperties}>
            {t.sub}
          </p>
          <div className="rise mt-8 flex flex-col gap-3 sm:flex-row" style={{ "--d": "200ms" } as CSSProperties}>
            <a href={deskUrl} className="btn">
              {t.cta}
            </a>
            <a href="#listen" className="btn-ghost">
              {t.secondary}
            </a>
          </div>
          <ul className="rise mt-8 space-y-2 text-[16px] text-ink-2" style={{ "--d": "280ms" } as CSSProperties}>
            {t.trust.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>

        <div className="rise grid w-full grid-cols-2 items-start gap-3 md:gap-5" style={{ "--d": "160ms" } as CSSProperties}>
          <DeviceFrame dark time="8:04" className="max-w-none">
            <div className="flex h-full min-h-0 flex-col px-4 pb-5 text-dark-ink" aria-label="Example morning call">
              <div className="mt-4 text-center">
                <span className="mx-auto grid size-12 place-items-center">
                  <MiniMark className="size-12" />
                </span>
                <p className="mt-2 text-[15px] font-medium">{t.callStatus}</p>
                <p className="font-mono text-[12px] text-dark-muted">
                  {t.callTitle} · {t.callClock}
                </p>
                <Waveform bars={12} className="mx-auto mt-2 justify-center text-accent" />
              </div>
              <div className="mt-auto">
                <ExampleTag className="mb-2 text-dark-muted">{t.example}</ExampleTag>
                <p lang="hi" className="font-deva rounded-[14px] rounded-bl-[4px] bg-white/10 px-3 py-2.5 text-[15px] leading-snug">
                  {t.callLine}
                </p>
                <p className="mt-1 text-[12px] text-dark-muted">{t.callLineLang}</p>
              </div>
            </div>
          </DeviceFrame>
          <DeviceFrame time="8:06" className="max-w-none">
            <aside className="flex h-full min-h-0 flex-col overflow-hidden" aria-label="Example WhatsApp briefing">
              <WhatsAppBriefing />
            </aside>
          </DeviceFrame>
        </div>
      </div>
    </section>
  );
}
