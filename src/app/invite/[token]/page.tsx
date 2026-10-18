"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);

  async function signIn() {
    setError(null);
    const res = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok) {
      setError(data.error || "Could not sign in.");
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
      setError(data.error || "Could not join.");
      return;
    }
    if (data.deskToken) router.push(`/d/${data.deskToken}`);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 py-10">
      <BrandMark />
      <h1 className="app-title mt-8">Join this family desk</h1>
      <p className="mt-3 text-[16px] text-muted-foreground">You will get the morning WhatsApp note and alerts. You cannot delete the family.</p>
      <div className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        {!signed ? (
          <button className="btn-primary" type="button" onClick={signIn}>
            Continue
          </button>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wa">WhatsApp</Label>
              <Input id="wa" className="field" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="98765 44111" />
            </div>
            <button className="btn-primary" type="button" onClick={join}>
              Join the desk
            </button>
          </>
        )}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </main>
  );
}
