"use client";

import { Plus } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { content } from "@/lib/content";
import { Eyebrow } from "./chrome";
import { useWaitlist } from "./waitlist";

export function Faq() {
  const t = content.faq;
  return (
    <section id="faq" className="section">
      <div className="container-site">
        <div className="grid items-start gap-10 md:grid-cols-12">
          <div className="md:sticky md:top-28 md:col-span-5">
            <Eyebrow label={t.eyebrow} />
            <h2 className="h2 mt-6" data-reveal>
              {t.h2}
            </h2>
          </div>
          <div className="md:col-span-7">
            {t.items.map((item, i) => (
              <details key={item.q} className="faq group border-b border-border" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[17px] font-medium [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="grid size-8 shrink-0 place-items-center text-ink-3 transition-transform duration-200 group-open:rotate-45">
                    <Plus className="size-4" strokeWidth={1.75} aria-hidden />
                  </span>
                </summary>
                <p className="-mt-1 pb-5 pr-10 text-[16px] leading-relaxed text-ink-2">{item.a}</p>
              </details>
            ))}
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
    <section id="join" className="dark-band section-finale bg-dark text-dark-ink" data-band="dark">
      <div className="container-site max-w-3xl">
        <p className="eyebrow" data-reveal>
          <span className="rule" />
          <span>{t.eyebrow}</span>
        </p>
        <h2 className="h2 mt-5 max-w-none" data-reveal>
          {t.h2a}
        </h2>
        <p className="mt-5 max-w-xl text-[17px] text-dark-muted" data-reveal>
          {t.sub}
        </p>

        <div className="mt-10 text-left" data-reveal>
          {state === "done" ? (
            <div role="status">
              <p className="text-[17px] font-medium">{t.thanks}</p>
              <button type="button" onClick={open} className="mt-2 text-[14px] text-dark-muted underline underline-offset-2 hover:text-dark-ink">
                {t.more}
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="relative grid gap-3" aria-label={t.cta}>
              <div className="grid gap-3 md:grid-cols-[1fr_170px_auto]">
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
                  className="input"
                />
                <label htmlFor={ids.lang} className="sr-only">
                  {t.lang}
                </label>
                <select id={ids.lang} name="parentLanguage" className="input appearance-none" defaultValue="">
                  <option value="" disabled>
                    {t.lang}
                  </option>
                  {content.waitlist.langs.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
                <button type="submit" className="btn h-12" disabled={state === "pending"}>
                  {state === "pending" ? "Joining…" : t.cta}
                </button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label htmlFor={ids.consent} className="flex items-center gap-2.5 text-[14px] text-dark-muted">
                  <input id={ids.consent} type="checkbox" name="consent" required className="size-4 accent-[var(--accent)]" />
                  {t.consent}
                </label>
                <button type="button" onClick={open} className="w-fit text-[14px] text-dark-muted underline underline-offset-2 hover:text-dark-ink">
                  {t.more}
                </button>
              </div>
              <div className="absolute -left-[9999px]" aria-hidden>
                <label htmlFor={ids.hp}>Company</label>
                <input id={ids.hp} name="company" tabIndex={-1} autoComplete="off" />
              </div>
              {state === "error" ? (
                <p className="text-[14px] text-[#f0a598]" role="alert">
                  {t.error}
                </p>
              ) : null}
            </form>
          )}
        </div>

        <p className="mt-8 text-[14px] text-dark-muted" data-reveal>
          {t.perks.join(" · ")}
        </p>
      </div>
    </section>
  );
}
