"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { AddToHome } from "@/components/pwa/register";
import { Input } from "@/components/ui/input";
import { messages, type Lang } from "@/lib/i18n/messages";
import { saveDeskToken } from "@/lib/storage";

async function openDesk(lang: Lang) {
  const me = await fetch("/api/auth/me", { cache: "no-store" });
  const body = (await me.json().catch(() => null)) as { ok?: boolean; deskToken?: string } | null;
  if (body?.ok && body.deskToken) {
    saveDeskToken(body.deskToken);
    window.location.href = `/d/${body.deskToken}?lang=${lang}`;
    return;
  }
  window.location.href = `/onboard?lang=${lang}`;
}

export function SignInForm({ lang }: { lang: Lang }) {
  const t = messages[lang];
  const other = lang === "hi" ? "en" : "hi";
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; mode?: string };
      if (!res.ok) {
        setError(data.error || t.setupSignFail);
        return;
      }
      if (data.mode === "email") {
        setSent(true);
        return;
      }
      await openDesk(lang);
    } catch {
      setError(t.setupSignFail);
    } finally {
      setSaving(false);
    }
  }

  async function verify() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error || t.setupSignFail);
        return;
      }
      await openDesk(lang);
    } catch {
      setError(t.setupSignFail);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-shell">
      <div className="app-shell-scroll px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <BrandMark />
          <Link href={`/signin?lang=${other}`} className="text-sm font-medium text-primary">
            {lang === "en" ? "हिं" : "EN"}
          </Link>
        </div>
        <p className="eyebrow mt-8">{t.setupSignKicker}</p>
        <h1 className="app-title mt-2">{t.signInTitle}</h1>
        <p className="mt-3 text-[16px] text-muted-foreground">{t.signInBody}</p>

        <label className="mt-6 block text-sm font-medium" htmlFor="email">
          {t.setupEmail}
        </label>
        <Input
          id="email"
          type="email"
          className="mt-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />

        {sent ? (
          <>
            <p className="mt-4 text-sm">{t.setupCheckInbox}</p>
            <label className="mt-4 block text-sm font-medium" htmlFor="code">
              {lang === "hi" ? "ईमेल वाला कोड" : "Code from the email"}
            </label>
            <Input
              id="code"
              className="mt-2"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="000000"
            />
          </>
        ) : null}

        {error ? <p className="mt-3 text-sm text-alert">{error}</p> : null}

        <button
          type="button"
          className="btn-primary mt-6"
          disabled={saving || !email.trim() || (sent && code.length < 6)}
          onClick={() => void (sent ? verify() : sendCode())}
        >
          {saving ? t.opening : sent ? t.setupContinue : t.signInCta}
        </button>

        <AddToHome lang={lang} />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t.signInNoDesk}{" "}
          <Link href={`/onboard?lang=${lang}`} className="font-medium text-primary">
            {lang === "hi" ? "सेटअप खोलें" : "Set up"}
          </Link>
        </p>
      </div>
    </main>
  );
}
