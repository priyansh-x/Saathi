import Image from "next/image";
import { content } from "@/lib/content";
import heroImg from "@/public/images/hero-maa-balcony.jpg";

export function Hero({ deskUrl }: { deskUrl: string }) {
  const t = content.hero;
  const line = t.voiceLines[0];

  return (
    <section className="pb-16 pt-10 md:pb-24 md:pt-16">
      <div className="container-site grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <h1 className="h1 rise">{t.h1a} {t.h1b}</h1>
          <p className="sub rise mt-6">{t.sub}</p>
          <div className="rise mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={deskUrl} className="btn">
              {t.cta}
            </a>
            <a href="#listen" className="btn-ghost">
              {t.secondary}
            </a>
          </div>
          <p className="rise mt-8 max-w-xl text-[14px] leading-relaxed text-ink-2">
            {t.trust.join(" · ")}
          </p>
        </div>

        <div className="rise">
          <div className="art relative aspect-[4/3.1]">
            <Image
              src={heroImg}
              alt={t.imageAlt}
              fill
              priority
              placeholder="blur"
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover object-[70%_center]"
            />
            <div className="absolute bottom-3 left-3 right-3 max-w-[280px] rounded-[12px] border border-border bg-bg-elevated p-3.5">
              <p className="text-[13px] font-medium">{t.callStatus}</p>
              <p className="font-mono text-[12px] text-ink-3">
                {t.callTitle} · {t.callClock}
              </p>
              <p className={`mt-3 text-[15px] leading-snug ${line.hi ? "font-deva" : ""}`}>{line.text}</p>
              <p className="mt-1 text-[11px] text-ink-3">
                {t.example} · {line.lang}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
