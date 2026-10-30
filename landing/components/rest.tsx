"use client";

import { Plus } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { content } from "@/lib/content";
import { useWaitlist } from "./waitlist";

export function Faq() {
  const t = content.faq;
  return (
    <section id="faq" className="section">
      <div className="container-site">
        <div className="grid items-start gap-10 md:grid-cols-12">
          <h2 className="h2 md:col-span-5" data-reveal>
            {t.h2}
          </h2>
          <div className="md:col-span-7">
            {t.items.map((item) => (
              <details key={item.q} className="group border-b border-border">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[18px] font-medium [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border">
                    <Plus className="size-4 group-open:rotate-45" strokeWidth={1.75} aria-hidden />
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

export function Finale({ deskUrl }: { deskUrl: string }) {
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
    <section id="join" className="section border-t border-border">
      <div className="container-site max-w-3xl">
        <h2 className="h2 max-w-none" data-reveal>
          {t.h2}
        </h2>
        <p className="sub mt-5" data-reveal>
          {t.sub}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row" data-reveal>
          <a href={deskUrl} className="btn">
            {t.cta}
          </a>
          <button type="button" onClick={open} className="btn-ghost">
            {t.secondary}
          </button>
        </div>

        <div className="mt-12 rounded-[20px] border border-border bg-bg-elevated p-4 md:p-6" data-reveal>
          {state === "done" ? (
            <p className="text-[17px] leading-relaxed text-ink-2" role="status">
              {t.thanks}{" "}
              <button type="button" onClick={open} className="text-accent underline-offset-2 hover:underline">
                {t.more}
              </button>
            </p>
          ) : (
            <form onSubmit={onSubmit} className="relative grid gap-3" aria-label={t.secondary}>
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
                <button type="submit" className="btn h-[52px]" disabled={state === "pending"}>
                  {t.secondary}
                </button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label htmlFor={ids.consent} className="flex items-center gap-2.5 text-[15px] text-ink-2">
                  <input id={ids.consent} type="checkbox" name="consent" required className="size-4 accent-[var(--accent)]" />
                  {t.consent}
                </label>
                <button type="button" onClick={open} className="w-fit text-[15px] text-ink-2 underline underline-offset-2 hover:text-ink">
                  {t.more}
                </button>
              </div>
              <div className="absolute -left-[9999px]" aria-hidden>
                <label htmlFor={ids.hp}>Company</label>
                <input id={ids.hp} name="company" tabIndex={-1} autoComplete="off" />
              </div>
              {state === "error" ? (
                <p className="text-[14px] text-act" role="alert">
                  {t.error}
                </p>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
