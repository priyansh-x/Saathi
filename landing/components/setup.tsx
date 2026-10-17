import { Play } from "lucide-react";
import { Tick } from "@/components/kit";
import { content } from "@/lib/content";
import { Eyebrow } from "./chrome";

export function Setup() {
  const t = content.setup;
  return (
    <section id="setup" className="section">
      <div className="container-site">
        <Eyebrow n={t.eyebrowN} label={t.eyebrow} />
        <div className="mt-6 grid items-end gap-6 md:grid-cols-12">
          <h2 className="h2 md:col-span-7" data-reveal>
            {t.h2a}
            <br />
            <span className="serif-line">{t.h2b}</span>
          </h2>
          <p className="sub md:col-span-5">{t.sub}</p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <ul className="mock-card space-y-2 p-5 text-sm">
            {t.rows.map((row) => (
              <li key={row} className="flex items-start gap-2 rounded-[12px] border border-border px-3 py-2">
                <Tick className="mt-0.5" />
                {row}
              </li>
            ))}
          </ul>
          <div className="mock-card p-5">
            <div className="rounded-[20px] border border-border bg-bg p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-ink text-bg">
                  <Play className="size-4" strokeWidth={1.5} aria-hidden />
                </span>
                <span className="flex h-8 flex-1 items-end gap-0.5" aria-hidden>
                  {Array.from({ length: 28 }).map((_, i) => (
                    <span
                      key={i}
                      className="flex-1 rounded-full bg-ink-3"
                      style={{ height: `${8 + ((i * 17) % 18)}px` }}
                    />
                  ))}
                </span>
                <span className="font-mono text-[12px] tracking-[0.06em] text-ink-2">{t.voiceClock}</span>
              </div>
              <p className="mt-3 text-sm text-ink-2">{t.voiceTitle}</p>
            </div>
          </div>
        </div>

        <ol className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {t.steps.map((s, i) => {
            const done = s.state === "Done";
            return (
              <li key={s.label} className="flex items-start gap-3 text-[14px]">
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-[12px] ${
                    done ? "bg-ink text-bg" : "border border-ink text-ink"
                  }`}
                >
                  {i + 1}
                </span>
                {s.label}
              </li>
            );
          })}
        </ol>
        <p className="mt-4 max-w-2xl text-ink-2">{t.consent}</p>
      </div>
    </section>
  );
}
