"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { AddToHome } from "@/components/pwa/register";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

function hrefLooksLikeAuthLink(href: string) {
  return /token_hash=|type=magiclink|type=signup|access_token=|\/auth\/v1\/verify/i.test(href);
}

export function SignInForm({ lang }: { lang: Lang }) {
  const t = messages[lang];
  const other = lang === "hi" ? "en" : "hi";
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function useLink(raw: string) {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/auth/verify-link", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ link: raw }),
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const href = window.location.href;
    if (hrefLooksLikeAuthLink(href)) {
      void useLink(href);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot landing from a clicked mail
  }, []);

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

  const hasLink = link.trim().length > 12;

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

        <p className="mt-4 text-sm">{t.setupCheckInbox}</p>
        <label className="mt-4 block text-sm font-medium" htmlFor="link">
          {t.setupPasteLink}
        </label>
        <Textarea
          id="link"
          className="mt-2 min-h-24"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://"
          autoComplete="off"
        />

        {error ? <p className="mt-3 text-sm text-alert">{error}</p> : null}

        {hasLink ? (
          <button
            type="button"
            className="btn-primary mt-6"
            disabled={saving}
            onClick={() => void useLink(link)}
          >
            {saving ? t.opening : t.setupUseLink}
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary mt-6"
            disabled={saving || !email.trim()}
            onClick={() => void sendCode()}
          >
            {saving ? t.opening : t.signInCta}
          </button>
        )}

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
