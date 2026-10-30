"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { DeviceFrame } from "@/components/kit";
import { content } from "@/lib/content";
import { usePrefersReducedMotion } from "@/lib/use-reveal";

const SHOTS = [
  { id: "today", src: "/images/desk/today-en.png", time: "8:34" },
  { id: "alerts", src: "/images/desk/alerts-en.png", time: "8:34" },
  { id: "history", src: "/images/desk/history-en.png", time: "8:34" },
] as const;

export function Tour({ exampleUrl }: { exampleUrl: string }) {
  const t = content.desk;
  const track = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [progress, setProgress] = useState(0);
  const [manual, setManual] = useState(0);

  useEffect(() => {
    const el = track.current;
    if (!el || reduced) return;
    let frame = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const next = total <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / total));
      setProgress(next);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced]);

  const step = reduced ? manual : Math.min(SHOTS.length - 1, Math.floor(progress * 0.999 * SHOTS.length));
  const shot = SHOTS[step];
  const copy = t.tour[step];

  function go(i: number) {
    if (reduced) {
      setManual(i);
      return;
    }
    const el = track.current;
    if (!el) return;
    const start = el.getBoundingClientRect().top + window.scrollY;
    const total = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: start + ((i + 0.12) / SHOTS.length) * total, behavior: "smooth" });
  }

  return (
    <section id="desk" className={reduced ? "section bg-bg-elevated" : "bg-bg-elevated"}>
      <div ref={track} className={reduced ? "" : "relative h-[240vh]"}>
        <div className={reduced ? "container-site" : "tour-sticky container-site"}>
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_280px] lg:gap-16">
            <div>
              <p className="eyebrow">
                <span className="rule" />
                <span>{t.eyebrow}</span>
              </p>
              <h2 className="h2 mt-4 max-w-none">{copy.title}</h2>
              <p className="sub mt-4">{copy.body}</p>
              <ol className="mt-8 space-y-2">
                {t.tour.map((item, i) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`text-left text-[15px] ${i === step ? "font-medium text-ink" : "text-ink-3"}`}
                      onClick={() => go(i)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ol>
              <p className="mt-8 text-[14px]">
                <a href={exampleUrl} className="font-medium text-accent underline-offset-4 hover:underline">
                  {t.exampleCta}
                </a>
                <span className="ml-2 text-ink-2">{t.exampleNote}</span>
              </p>
            </div>

            <div className="mx-auto w-full max-w-[280px]">
              <DeviceFrame overlay time={shot.time} className="mx-auto">
                <div className="relative h-full overflow-hidden bg-bg">
                  {SHOTS.map((s, i) => (
                    <Image
                      key={s.id}
                      src={s.src}
                      alt={t.shots[i].alt}
                      fill
                      sizes="260px"
                      className="object-contain object-top"
                      style={{ opacity: i === step ? 1 : 0, transition: "opacity 280ms ease" }}
                      priority={i === 0}
                    />
                  ))}
                </div>
              </DeviceFrame>
              <p className="example-tag mt-3 text-center">
                {t.shots[step].label} · {content.listen.example}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
