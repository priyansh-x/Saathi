import Image from "next/image";
import { Bell, MessageSquareText, PhoneMissed, StickyNote } from "lucide-react";
import type { CSSProperties } from "react";
import { content } from "@/lib/content";
import { Eyebrow } from "./chrome";
import nightImg from "@/public/images/problem-night-child.jpg";

const appIcon = {
  Reminder: Bell,
  Calls: PhoneMissed,
  Notes: StickyNote,
} as const;

export function Problem() {
  const t = content.problem;
  return (
    <section id="problem" className="section">
      <div className="container-site">
        <Eyebrow n={t.eyebrowN} label={t.eyebrow} />
        <div className="mt-6 grid items-end gap-6 md:grid-cols-12">
          <h2 className="h2 md:col-span-7" data-reveal>
            {t.h2a}
            <br />
            <span className="serif-line text-ink-2">{t.h2b}</span>
          </h2>
          <p className="sub md:col-span-5" data-reveal>
            {t.sub}
          </p>
        </div>

        <figure className="mt-12 md:mt-16" data-reveal>
          <div className="art relative aspect-[4/5] bg-dark sm:aspect-[16/10] md:aspect-[16/8.5]">
            <Image
              src={nightImg}
              alt={t.imageAlt}
              fill
              placeholder="blur"
              sizes="(min-width: 1216px) 1160px, 100vw"
              className="object-cover object-[30%_center]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark/70 via-dark/10 to-transparent md:bg-gradient-to-l md:from-dark/80 md:via-dark/30" />

            <div
              className="absolute inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-6 sm:w-[340px] md:right-10 md:top-10"
              data-stagger
              aria-label="Example: a day of unanswered questions"
            >
              <div className="hidden text-center text-white sm:block">
                <p className="text-[13px] font-medium opacity-80">{t.lockDate}</p>
                <p className="text-[56px] font-semibold leading-none tracking-tight">{t.lockTime}</p>
              </div>
              <ol className="mt-4 space-y-2">
                {t.notifications.map((n, i) => {
                  const Icon = appIcon[n.app as keyof typeof appIcon] ?? MessageSquareText;
                  return (
                    <li
                      key={n.title}
                      className={`notif flex items-center gap-3 rounded-[18px] bg-[rgba(255,252,248,0.82)] p-3 shadow-lg backdrop-blur-md ${i > 2 ? "hidden sm:flex" : ""}`}
                      style={{ "--i": i } as CSSProperties}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-accent-soft text-accent">
                        <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.06em] text-ink-3">
                          {n.app}
                          <span className="font-mono normal-case tracking-normal">{n.time}</span>
                        </span>
                        <span className="block truncate text-[14px] font-medium text-ink">{n.title}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
          <figcaption className="mt-3 flex flex-wrap justify-between gap-2 text-[13px] text-ink-3">
            <span>{t.caption}</span>
            <span>Illustration · example notifications</span>
          </figcaption>
        </figure>

      </div>

      <p className="h2 mx-auto mt-24 px-5 text-center md:mt-32" data-reveal>
        {t.closerA}
        <br />
        <span className="serif-line accent-phrase">{t.closerB}</span>
      </p>
    </section>
  );
}
