"use client";

import { useState } from "react";
import { DeviceFrame, ExampleTag, WhatsAppBriefing } from "@/components/kit";
import { CallScreen, PlayButton, useMorningCall } from "@/components/call-demo";
import { type CallLang } from "@/lib/call-audio";
import { content } from "@/lib/content";

export function Listen() {
  const t = content.listen;
  const [lang, setLang] = useState<CallLang>("hi");
  const { audioRef, playing, done, toggle, seekLine, cue, index, line, reduced } = useMorningCall(lang);
  const shown = done ? [...cue.lines] : playing ? cue.lines.slice(0, index) : [cue.lines[0]];
  const activeLine = playing ? line : null;

  return (
    <section id="listen" className="section pt-4 md:pt-6">
      <audio ref={audioRef} preload="auto" />
      <div className="container-site">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">
              <span className="rule" />
              <span>{t.eyebrow}</span>
            </p>
            <h2 className="h2 mt-3">{t.h2}</h2>
            <p className="sub mt-3">{t.sub}</p>
          </div>
          <ExampleTag>{t.tag}</ExampleTag>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="seg max-w-full overflow-x-auto" role="group" aria-label="Call language">
            {t.languages.map((l) => {
              const id = l.live ? (l.id as CallLang) : null;
              return (
                <button
                  key={l.id}
                  type="button"
                  disabled={!id}
                  aria-pressed={id === lang}
                  onClick={() => id && setLang(id)}
                  className="disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {l.label}
                  {!l.live ? <span className="text-[11px]">{t.soon}</span> : null}
                </button>
              );
            })}
          </div>
          {t.scenes.map((scene) => (
            <button
              key={scene.id}
              type="button"
              className="rounded-[8px] border border-border bg-bg-elevated px-3 py-1.5 text-[13px] hover:border-ink/25"
              onClick={() => seekLine(scene.start)}
            >
              {scene.label}
            </button>
          ))}
          <PlayButton playing={playing} done={done} onClick={toggle} className="btn !min-h-9 !px-3.5 text-[13px]" />
        </div>

        <div className="mt-10 grid items-center justify-items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
          <DeviceFrame dark time="8:04" className="max-w-[250px] lg:max-w-[268px]">
            <CallScreen lang={lang} playing={playing} done={done} line={activeLine} shown={shown} />
          </DeviceFrame>
          <p className="text-[13px] text-ink-3">{t.toYou}</p>
          <DeviceFrame time="8:06" className="max-w-[250px] lg:max-w-[268px]">
            <aside className="flex h-full min-h-0 flex-col overflow-hidden" aria-label="Example: WhatsApp briefing">
              <WhatsAppBriefing landed={done || reduced} />
            </aside>
          </DeviceFrame>
        </div>
      </div>
    </section>
  );
}
