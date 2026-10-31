"use client";

import { ArrowRight, Check, Plus } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { content } from "@/lib/content";
import { Eyebrow } from "./chrome";
import { useWaitlist } from "./waitlist";

export function Faq() {
  const t = content.faq;
  const { open } = useWaitlist();
  const [openIdx, setOpenIdx] = useState(0);
  const base = useId();
  return (
    <section id="faq" className="section bg-bg-elevated">
      <div className="container-site">
        <div className="grid items-start gap-12 md:grid-cols-12">
          <div className="md:sticky md:top-32 md:col-span-5">
            <Eyebrow label={t.eyebrow} />
            <h2 className="h2 mt-6" data-reveal>
              {t.h2a} <em>{t.h2b}</em>
            </h2>
            <p className="mt-8 text-[15px] text-ink-2">{t.more}</p>
            <button type="button" onClick={open} className="link-arrow mt-2 text-[15px]">
              {t.moreCta}
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
            </button>
          </div>
          <div className="md:col-span-7">
            {t.items.map((item, i) => {
              const on = i === openIdx;
              const id = `${base}-${i}`;
              return (
                <div key={item.q} className="border-b border-border first:border-t">
                  <h3>
                    <button
                      type="button"
                      aria-expanded={on}
                      aria-controls={id}
                      onClick={() => setOpenIdx(on ? -1 : i)}
                      className="flex w-full items-center justify-between gap-6 py-6 text-left text-[18px] font-medium transition-colors hover:text-accent"
                    >
                      {item.q}
                      <span
                        className={`grid size-9 shrink-0 place-items-center rounded-full border transition-[transform,background,border-color,color] duration-300 ${
                          on ? "rotate-45 border-accent bg-accent text-white" : "border-border text-ink-2"
                        }`}
                      >
                        <Plus className="size-4" strokeWidth={2} aria-hidden />
                      </span>
                    </button>
                  </h3>
                  <div id={id} className="acc-body" data-open={on} role="region">
                    <div>
                      <p className="pb-6 pr-12 text-[16px] leading-relaxed text-ink-2">{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Finale() {
  const t = content.finale;
  const { open } = useWaitlist();
  const [state, setState] = useState<"idle" | "pending" | "done" | "error">("idle");
  const ids = { contact: useId(), lang: useId(), consent: useId(), hp: useId() };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setState("pending");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: data.get("contact"),
          parentLanguage: data.get("parentLanguage"),
          consent: data.get("consent") === "on",
          pilotInterest: true,
          company: data.get("company"),
        }),
      });
      const json = (await res.json()) as { ok?: boolean };
      if (!res.ok || !json.ok) throw new Error("fail");
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <section id="join" className="dark-band grain relative overflow-hidden" data-band="dark">
      <div
        className="pointer-events-none absolute bottom-[-55%] left-1/2 -z-10 aspect-square w-[min(1200px,160vw)] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(240,170,90,0.55), rgba(176,83,42,0.35) 45%, rgba(176,83,42,0) 75%)",
          maskImage: "linear-gradient(to bottom, #000 30%, transparent 52%)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 30%, transparent 52%)",
        }}
        aria-hidden
      />
      <div className="container-site relative max-w-3xl py-28 text-center md:py-40">
        <p className="eyebrow mx-auto" data-reveal>
          <span className="dot" />
          <span>{t.eyebrow}</span>
        </p>
        <h2 className="h2 mx-auto mt-7 max-w-[16ch] text-[clamp(2.6rem,6vw,4.8rem)]" data-reveal>
          {t.h2a} <em>{t.h2b}</em>
        </h2>
        <p className="sub mx-auto mt-6" data-reveal>
          {t.sub}
        </p>

        <div className="mx-auto mt-12 max-w-2xl text-left" data-reveal>
          {state === "done" ? (
            <div role="status" className="pop-in rounded-[24px] border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-good text-white">
                <Check className="size-6" strokeWidth={2.5} aria-hidden />
              </span>
              <p className="mt-4 text-[18px] font-medium">{t.thanks}</p>
              <button
                type="button"
                onClick={open}
                className="mt-2 text-[14px] text-dark-muted underline underline-offset-4 hover:text-dark-ink"
              >
                {t.more}
              </button>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="relative grid gap-3 rounded-[28px] border border-white/10 bg-white/[0.04] p-3 backdrop-blur"
              aria-label={t.cta}
            >
              <div className="grid gap-2 md:grid-cols-[1fr_180px_auto]">
                <label htmlFor={ids.contact} className="sr-only">
                  {t.contact}
                </label>
                <input
                  id={ids.contact}
                  name="contact"
                  required
                  maxLength={200}
                  autoComplete="email"
                  placeholder={t.contact}
                  className="input !rounded-full !border-transparent !bg-white/8"
                />
                <label htmlFor={ids.lang} className="sr-only">
                  {t.lang}
                </label>
                <select
                  id={ids.lang}
                  name="parentLanguage"
                  className="input appearance-none !rounded-full !border-transparent !bg-white/8"
                  defaultValue=""
                >
                  <option value="" disabled>
                    {t.lang}
                  </option>
                  {content.waitlist.langs.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
                <button type="submit" className="btn" disabled={state === "pending"}>
                  {state === "pending" ? t.pending : t.cta}
                  <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
                </button>
              </div>
              <div className="flex flex-col gap-2 px-3 pb-1 sm:flex-row sm:items-center sm:justify-between">
                <label htmlFor={ids.consent} className="flex items-center gap-2.5 text-[14px] text-dark-muted">
                  <input id={ids.consent} type="checkbox" name="consent" required className="size-4 accent-[var(--accent)]" />
                  {t.consent}
                </label>
                <button
                  type="button"
                  onClick={open}
                  className="w-fit text-[14px] text-dark-muted underline underline-offset-4 hover:text-dark-ink"
                >
                  {t.more}
                </button>
              </div>
              <div className="absolute -left-[9999px]" aria-hidden>
                <label htmlFor={ids.hp}>Company</label>
                <input id={ids.hp} name="company" tabIndex={-1} autoComplete="off" />
              </div>
              {state === "error" ? (
                <p className="px-3 pb-1 text-[14px] text-[#f0a598]" role="alert">
                  {t.error}
                </p>
              ) : null}
            </form>
          )}
        </div>

        <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[14px] text-dark-muted" data-reveal>
          {t.perks.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <Check className="size-4 text-[#e8a27c]" strokeWidth={2.5} aria-hidden />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
