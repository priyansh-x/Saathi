"use client";

import { createContext, useContext, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { content } from "@/lib/content";

const Ctx = createContext<{ open: () => void } | null>(null);

export function useWaitlist() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("WaitlistProvider missing");
  return ctx;
}

export function WaitlistProvider({ children }: { children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const last = useRef<HTMLElement | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const hp = useId();

  function open() {
    last.current = document.activeElement as HTMLElement;
    setDone(false);
    setError("");
    dialog.current?.showModal();
  }

  function close() {
    dialog.current?.close();
    last.current?.focus();
  }

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      close();
    };
    el.addEventListener("cancel", onCancel);
    return () => el.removeEventListener("cancel", onCancel);
  });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          contact: data.get("contact"),
          location: data.get("location"),
          parentCity: data.get("parentCity"),
          parentLanguage: data.get("parentLanguage"),
          pilotInterest: data.get("pilotInterest") === "on",
          consent: data.get("consent") === "on",
          company: data.get("company"),
        }),
      });
      const json = (await res.json()) as { ok?: boolean };
      if (!res.ok || !json.ok) throw new Error("fail");
      setDone(true);
    } catch {
      setError(content.waitlist.error);
    } finally {
      setPending(false);
    }
  }

  const t = content.waitlist;
  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <dialog
        ref={dialog}
        className="w-[min(100%-32px,32rem)] rounded-[20px] border border-border bg-bg-elevated p-6 text-ink shadow-[var(--shadow-mock)] backdrop:bg-ink/35 open:animate-[dialog-in_0.3s_var(--ease)]"
        aria-labelledby="waitlist-title"
      >
        <h2 id="waitlist-title" className="text-[22px] font-semibold tracking-tight">
          {t.title}
        </h2>
        <p className="mt-1 text-[15px] text-ink-2">{t.intro}</p>
        {done ? (
          <p className="mt-4 text-[17px] leading-relaxed text-ink-2" role="status">{t.thanks}</p>
        ) : (
          <form className="mt-5 space-y-3" onSubmit={onSubmit}>
            <label className="block text-sm">
              {t.name}
              <input name="name" maxLength={200} className="input mt-1.5" />
            </label>
            <label className="block text-sm">
              {t.contact}
              <input name="contact" required maxLength={200} className="input mt-1.5" />
            </label>
            <label className="block text-sm">
              {t.location}
              <input name="location" maxLength={200} className="input mt-1.5" />
            </label>
            <label className="block text-sm">
              {t.parentCity}
              <input name="parentCity" maxLength={200} className="input mt-1.5" />
            </label>
            <label className="block text-sm">
              {t.parentLang}
              <select name="parentLanguage" className="input mt-1.5">
                {t.langs.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" name="pilotInterest" className="mt-1 size-4 accent-[var(--accent)]" />
              {t.interest}
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" name="consent" required className="mt-1 size-4 accent-[var(--accent)]" />
              {t.consent}
            </label>
            <div className="absolute -left-[9999px]" aria-hidden>
              <label htmlFor={hp}>Company</label>
              <input id={hp} name="company" tabIndex={-1} autoComplete="off" />
            </div>
            {error ? <p className="text-sm text-act">{error}</p> : null}
            <button type="submit" className="btn w-full" disabled={pending}>
              {t.submit}
            </button>
          </form>
        )}
        <button type="button" onClick={close} className="mt-4 text-sm text-ink-2 underline-offset-2 hover:underline">
          {t.close}
        </button>
      </dialog>
    </Ctx.Provider>
  );
}

export function JoinButton({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  const { open } = useWaitlist();
  return (
    <button type="button" onClick={open} className={className || "btn"}>
      {children ?? content.nav.cta}
    </button>
  );
}
