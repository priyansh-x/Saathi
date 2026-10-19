"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messages, type Lang } from "@/lib/i18n/messages";

export function InviteJoin({ lang }: { lang: Lang }) {
  const params = useParams<{ token: string }>();
  const t = messages[lang];
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);
  const other = lang === "hi" ? "en" : "hi";

  async function signIn() {
    setError(null);
    const res = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok) {
      setError(data.error || t.setupSignFail);
      return;
    }
    setSigned(true);
  }

  async function join() {
    setError(null);
    const res = await fetch("/api/invite/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: params.token, name, whatsapp }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; deskToken?: string };
    if (!res.ok) {
      setError(data.error || t.inviteFail);
      return;
    }
    if (data.deskToken) router.push(`/d/${data.deskToken}?lang=${lang}`);
  }

  return (
    <main className={`mx-auto flex min-h-dvh w-full min-w-0 max-w-[480px] flex-col overflow-x-clip px-5 py-10 ${lang === "hi" ? "font-devanagari" : ""}`}>
      <div className="flex items-center justify-between">
        <BrandMark />
        <a href={`?lang=${other}`} className="text-sm font-medium text-primary">
          {lang === "en" ? "हिं" : "EN"}
        </a>
      </div>
      <h1 className="app-title mt-8">{t.inviteTitle}</h1>
      <p className="mt-3 text-[16px] text-muted-foreground">{t.inviteBody}</p>
      <div className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t.setupEmail}</Label>
          <Input id="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        {!signed ? (
          <button className="btn-primary" type="button" onClick={signIn}>
            {t.setupContinue}
          </button>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="name">{t.setupYourName}</Label>
              <Input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wa">{t.setupYourWhatsapp}</Label>
              <Input id="wa" className="field" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+910000000003" />
            </div>
            <button className="btn-primary" type="button" onClick={join}>
              {t.inviteJoin}
            </button>
          </>
        )}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </main>
  );
}
