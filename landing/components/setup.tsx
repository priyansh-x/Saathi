import Image from "next/image";
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
            <p className="mt-3 text-[14px] text-ink-2">{t.phones.join(" · ")}</p>
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-stretch">
          <div className="art relative min-h-[280px] lg:min-h-[420px]" data-reveal>
            <Image
              src={setupImg}
              alt={t.imageAlt}
              fill
              placeholder="blur"
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-cover object-[30%_center]"
            />
            <div className="absolute bottom-4 left-4 right-4 rounded-[12px] border border-border bg-bg-elevated p-4 sm:left-auto sm:w-[280px]">
              <p className="text-[13px] font-medium">{t.voiceTitle}</p>
              <p className="mt-2 text-[14px] text-ink-2">{t.voiceBar}</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="mock-card p-5 md:p-6" data-reveal aria-label="Example: setup form">
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-semibold">Set up Maa&apos;s calls</p>
                <span className="text-[12px] text-ink-3">Example</span>
              </div>
              <dl className="mt-4 space-y-2">
                {t.form.map((row) => (
                  <div key={row.label} className="border-b border-border py-2.5 last:border-0">
                    <dt className="text-[12px] text-ink-3">{row.label}</dt>
                    <dd className="mt-0.5 text-[15px]">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <ol className="mock-card p-5 md:p-6" data-reveal>
              {t.steps.map((s, i) => (
                <li key={s.label} className="flex items-baseline gap-3 border-b border-border py-2.5 text-[15px] last:border-0">
                  <span className="w-4 shrink-0 font-mono text-[12px] text-ink-3">{i + 1}</span>
                  <span className={`flex-1 ${s.state ? "" : "text-ink-3"}`}>{s.label}</span>
                  {s.state ? <span className="text-[12px] text-ink-3">{s.state}</span> : null}
                </li>
              ))}
            </ol>
          </div>
        </div>
        <p className="mt-6 max-w-2xl text-[15px] text-ink-2">{t.consent}</p>
      </div>
    </section>
  );
}
