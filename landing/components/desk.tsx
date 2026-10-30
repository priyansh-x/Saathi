import Image from "next/image";
import { DeviceFrame, ExampleTag, WhatsAppAlert } from "@/components/kit";
import { content } from "@/lib/content";

export function Desk({ exampleUrl }: { exampleUrl: string }) {
  const t = content.desk;
  return (
    <section id="desk" className="section">
      <div className="container-site">
        <div data-reveal>
          <h2 className="h2">{t.h2}</h2>
          <p className="sub mt-4">{t.sub}</p>
          <p className="mt-4">
            <a href={exampleUrl} className="font-medium text-accent underline-offset-4 hover:underline">
              {t.exampleCta}
            </a>
            <span className="ml-2 text-[14px] text-ink-2">{t.exampleNote}</span>
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {t.shots.map((shot) => (
            <figure key={shot.src} className="mock-card overflow-hidden" data-reveal>
              <div className="relative aspect-[9/16] bg-bg-sunk">
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  fill
                  sizes="(min-width: 768px) 280px, 100vw"
                  className="object-cover object-top"
                />
              </div>
              <figcaption className="flex items-center justify-between px-4 py-3 text-[14px]">
                <span className="font-medium">{shot.label}</span>
                <ExampleTag />
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-16 grid items-center gap-10 md:grid-cols-[1fr_280px]" data-reveal>
          <div>
            <h3 className="text-[22px] font-semibold tracking-tight">{t.waTitle}</h3>
            <p className="mt-3 max-w-md text-[16px] leading-relaxed text-ink-2">{t.waTag}. Test data only.</p>
          </div>
          <DeviceFrame time="8:09" className="max-w-[260px] justify-self-center">
            <WhatsAppAlert />
          </DeviceFrame>
        </div>
      </div>
    </section>
  );
}
