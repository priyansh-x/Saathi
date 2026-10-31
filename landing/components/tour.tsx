"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { DeviceFrame } from "@/components/kit";
import { Eyebrow } from "@/components/chrome";
import { content } from "@/lib/content";
import { usePrefersReducedMotion } from "@/lib/use-reveal";

function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return wide;
}

export function Tour({ exampleUrl }: { exampleUrl: string }) {
  const t = content.desk;
  const track = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const wide = useWide();
  const scrolly = wide && !reduced;
  const [progress, setProgress] = useState(0);
  const [manual, setManual] = useState(0);
  const n = t.shots.length;

  useEffect(() => {
    const el = track.current;
    if (!el || !scrolly) return;
    let frame = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      setProgress(total <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / total)));
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
  }, [scrolly]);

  const step = scrolly ? Math.min(n - 1, Math.floor(progress * 0.999 * n)) : manual;

  function go(i: number) {
    if (!scrolly) {
      setManual(i);
      return;
    }
    const el = track.current;
    if (!el) return;
    const start = el.getBoundingClientRect().top + window.scrollY;
    const total = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: start + ((i + 0.15) / n) * total, behavior: "smooth" });
  }

  function stepFill(i: number) {
    if (!scrolly) return i === step ? 1 : 0;
    return Math.min(1, Math.max(0, progress * n - i));
  }

  return (
    <section id="desk" className={`relative overflow-x-clip bg-bg-sunk/60 ${scrolly ? "" : "section"}`}>
      <div ref={track} className={scrolly ? "relative h-[300vh]" : ""}>
        <div className={scrolly ? "tour-sticky" : ""}>
          <div className="container-site grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
            <div>
              <Eyebrow label={t.eyebrow} />
              <h2 className="h2 mt-6">
                {t.h2a} <em>{t.h2b}</em>
              </h2>

              <ol className="mt-10 space-y-2">
                {t.tour.map((item, i) => {
                  const on = i === step;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => go(i)}
                        aria-current={on ? "step" : undefined}
                        className={`relative w-full overflow-hidden rounded-[20px] py-4 pl-6 pr-4 text-left transition-[background] duration-300 ${
                          on ? "bg-bg-elevated shadow-[var(--shadow-mock)]" : "hover:bg-bg-elevated/50"
                        }`}
                      >
                        <span className="absolute bottom-4 left-0 top-4 w-[3px] overflow-hidden rounded-full bg-border" aria-hidden>
                          <span
                            className="block w-full rounded-full bg-accent"
                            style={{ height: `${stepFill(i) * 100}%`, transition: scrolly ? "none" : "height 300ms" }}
                          />
                        </span>
                        <span className="flex items-baseline gap-3">
                          <span className="font-mono text-[12px] text-ink-3">0{i + 1}</span>
                          <span className={`text-[17px] font-medium ${on ? "text-ink" : "text-ink-2"}`}>{item.label}</span>
                        </span>
                        <span className="acc-body" data-open={on}>
                          <span className="block">
                            <span className="display block pt-2 text-[24px] leading-tight">{item.title}</span>
                            <span className="block pt-2 text-[15px] leading-relaxed text-ink-2">{item.body}</span>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px]">
                <a href={exampleUrl} className="link-arrow">
                  {t.exampleCta}
                  <ArrowUpRight className="size-4" strokeWidth={2} aria-hidden />
                </a>
                <span className="text-ink-3">{t.exampleNote}</span>
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-[300px]">
              <div
                className="absolute inset-[-25%] rounded-full opacity-80 blur-3xl"
                style={{ background: "radial-gradient(closest-side, var(--accent-soft), transparent)" }}
                aria-hidden
              />
              <DeviceFrame time="8:34" className="relative mx-auto">
                <div className="relative h-full overflow-hidden bg-[#fbf7f2]">
                  {t.shots.map((s, i) => (
                    <Image
                      key={s.id}
                      src={s.src}
                      alt={s.alt}
                      fill
                      sizes="300px"
                      className="object-contain object-top"
                      style={{
                        opacity: i === step ? 1 : 0,
                        transform: i === step ? "none" : i < step ? "translateY(-12px)" : "translateY(12px)",
                        transition: "opacity 400ms var(--ease), transform 600ms var(--ease)",
                      }}
                      preload={i === 0}
                    />
                  ))}
                </div>
              </DeviceFrame>
              <p className="relative mt-4 text-center text-[12px] text-ink-3">
                {t.shots[step].label} · {content.listen.example} · {t.platforms}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
