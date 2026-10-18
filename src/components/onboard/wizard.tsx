"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CHILD_WRITTEN_TEXT } from "@/lib/consent-copy";
import {
  ADDRESS_TERMS,
  CALL_TIMES,
  LANGUAGE_OPTIONS,
  type OnboardInput,
  type ParsedMedicine,
} from "@/lib/onboard-form";
import { writeHousehold } from "@/lib/store";
import type { Household, Language, Relation } from "@/lib/types";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "saathi_onboard_draft_v2";
type Step = "sign" | "you" | "parent" | "morning" | "medicines" | "neighbour" | "consent" | "done";
const FLOW: Step[] = ["sign", "you", "parent", "morning", "medicines", "neighbour", "consent"];

const empty: OnboardInput = {
  childName: "",
  childWhatsapp: "",
  parentName: "",
  addressTerm: "Maa",
  parentPhone: "",
  city: "",
  languages: ["hi"],
  callTime: "08:30",
  medicines: [],
  neighborName: "",
  neighborPhone: "",
  toldParent: false,
};

function loadDraft(): OnboardInput {
  if (typeof window === "undefined") return empty;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw), toldParent: false };
  } catch {
    return empty;
  }
}

function clockLabel(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const hour = h || 0;
  const suffix = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 || 12;
  return `${h12}:${String(m || 0).padStart(2, "0")} ${suffix}`;
}

export function OnboardWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("sign");
  const [form, setForm] = useState<OnboardInput>(loadDraft);
  const [email, setEmail] = useState("");
  const [signedEmail, setSignedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: { ok?: boolean; email?: string }) => {
        if (data.ok && data.email) {
          setSignedEmail(data.email);
          setEmail(data.email);
          setStep((s) => (s === "sign" ? "you" : s));
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form]);

  function patch<K extends keyof OnboardInput>(key: K, value: OnboardInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  async function signIn() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; mode?: string };
      if (!res.ok) {
        setError(data.error || "Could not sign in.");
        return;
      }
      if (data.mode === "email") {
        setSent(true);
        return;
      }
      setSignedEmail(email.trim().toLowerCase());
      setStep("you");
    } catch {
      setError("Could not sign in. Check your connection.");
    } finally {
      setSaving(false);
    }
  }

  function next() {
    const i = FLOW.indexOf(step);
    if (i >= 0 && i < FLOW.length - 1) setStep(FLOW[i + 1]!);
  }

  function back() {
    if (step === "done") return;
    const i = FLOW.indexOf(step);
    if (i <= 0) return;
    setStep(FLOW[i - 1]!);
  }

  async function submit() {
    if (!form.toldParent) {
      setError("The first call must not be a surprise. Tell them first, then tick the box.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, toldParent: true }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; token?: string };
      if (!res.ok || !data.token) {
        setError(data.error || "Could not save. Try again.");
        return;
      }
      writeHousehold(toHousehold(form));
      sessionStorage.removeItem(DRAFT_KEY);
      setToken(data.token);
      setStep("done");
    } catch {
      setError("Could not save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const who = form.addressTerm.trim() || "them";
  const langs = form.languages;

  const body = useMemo(() => {
    if (step === "sign") {
      return (
        <>
          <p className="text-sm text-muted-foreground">Sign in</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">A link to your email. No SMS.</h1>
          <p className="mt-3 text-muted-foreground">
            When mocks are on, this stays on this phone. In production Saathi emails a one-time link through
            Supabase Auth.
          </p>
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          {sent ? (
            <p className="mt-4 text-sm">Check that inbox for a sign-in link. It expires in 30 minutes.</p>
          ) : null}
        </>
      );
    }
    if (step === "you") {
      return (
        <>
          <p className="text-sm text-muted-foreground">You{signedEmail ? ` · ${signedEmail}` : ""}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Who gets the morning note?</h1>
          <div className="mt-6 space-y-4">
            <Field label="Your name" htmlFor="childName">
              <Input
                id="childName"
                value={form.childName}
                onChange={(e) => patch("childName", e.target.value)}
                placeholder="Ananya"
              />
            </Field>
            <Field label="Your WhatsApp" htmlFor="childWhatsapp">
              <Input
                id="childWhatsapp"
                value={form.childWhatsapp}
                onChange={(e) => patch("childWhatsapp", e.target.value)}
                placeholder="98765 44110"
              />
            </Field>
          </div>
        </>
      );
    }
    if (step === "parent") {
      return (
        <>
          <p className="text-sm text-muted-foreground">Your parent</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Who should we call?</h1>
          <div className="mt-6 space-y-4">
            <Field label="Full name" htmlFor="parentName">
              <Input
                id="parentName"
                value={form.parentName}
                onChange={(e) => patch("parentName", e.target.value)}
                placeholder="Kamla Sharma"
              />
            </Field>
            <Field label="What you call them" htmlFor="addressTerm">
              <div className="flex flex-wrap gap-2">
                {ADDRESS_TERMS.map((term) => (
                  <Chip
                    key={term}
                    on={form.addressTerm === term}
                    onClick={() => patch("addressTerm", term)}
                  >
                    {term}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Their phone" htmlFor="parentPhone">
              <Input
                id="parentPhone"
                value={form.parentPhone}
                onChange={(e) => patch("parentPhone", e.target.value)}
                placeholder="98100 22118"
              />
            </Field>
            <Field label="City" htmlFor="city">
              <Input id="city" value={form.city} onChange={(e) => patch("city", e.target.value)} placeholder="Delhi" />
            </Field>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Languages of the call</legend>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.code}
                    on={langs.includes(opt.code)}
                    onClick={() => {
                      const next = langs.includes(opt.code)
                        ? langs.filter((c) => c !== opt.code)
                        : [...langs, opt.code];
                      patch("languages", next.length ? next : [opt.code]);
                    }}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </fieldset>
          </div>
        </>
      );
    }
    if (step === "morning") {
      return (
        <>
          <p className="text-sm text-muted-foreground">The morning</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">When should Saathi ring {who}?</h1>
          <div className="mt-6 flex flex-wrap gap-2">
            {CALL_TIMES.map((time) => (
              <Chip key={time} on={form.callTime === time} onClick={() => patch("callTime", time)}>
                {clockLabel(time)}
              </Chip>
            ))}
          </div>
        </>
      );
    }
    if (step === "medicines") {
      return (
        <>
          <p className="text-sm text-muted-foreground">Optional</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Morning tablets, if any.</h1>
          <p className="mt-3 text-muted-foreground">Skip if they do not take a daily tablet. You can edit this later.</p>
          <ul className="mt-6 space-y-4">
            {form.medicines.map((med, index) => (
              <li key={index} className="space-y-2 rounded-2xl border border-border p-3">
                <Field label="Name" htmlFor={`med-name-${index}`}>
                  <Input
                    id={`med-name-${index}`}
                    value={med.name}
                    onChange={(e) => patch("medicines", replaceMed(form.medicines, index, { ...med, name: e.target.value }))}
                  />
                </Field>
                <Field label="Time" htmlFor={`med-time-${index}`}>
                  <Input
                    id={`med-time-${index}`}
                    type="time"
                    value={med.time}
                    onChange={(e) => patch("medicines", replaceMed(form.medicines, index, { ...med, time: e.target.value }))}
                  />
                </Field>
                <div className="flex gap-2">
                  <Chip
                    on={med.withFood}
                    onClick={() => patch("medicines", replaceMed(form.medicines, index, { ...med, withFood: true }))}
                  >
                    With food
                  </Chip>
                  <Chip
                    on={!med.withFood}
                    onClick={() => patch("medicines", replaceMed(form.medicines, index, { ...med, withFood: false }))}
                  >
                    Without food
                  </Chip>
                </div>
                <button
                  type="button"
                  className="text-sm text-muted-foreground"
                  onClick={() => patch("medicines", form.medicines.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-4 text-sm font-medium"
            onClick={() =>
              patch("medicines", [...form.medicines, { name: "", time: form.callTime, withFood: true }])
            }
          >
            Add a tablet
          </button>
        </>
      );
    }
    if (step === "neighbour") {
      return (
        <>
          <p className="text-sm text-muted-foreground">Optional</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Someone who can knock.</h1>
          <p className="mt-3 text-muted-foreground">
            We will not message them until they reply yes. Skip if you do not have someone nearby yet.
          </p>
          <div className="mt-6 space-y-4">
            <Field label="Neighbour’s name" htmlFor="neighborName">
              <Input
                id="neighborName"
                value={form.neighborName}
                onChange={(e) => patch("neighborName", e.target.value)}
                placeholder="Sunita"
              />
            </Field>
            <Field label="Neighbour’s phone" htmlFor="neighborPhone">
              <Input
                id="neighborPhone"
                value={form.neighborPhone}
                onChange={(e) => patch("neighborPhone", e.target.value)}
                placeholder="98450 77821"
              />
            </Field>
          </div>
        </>
      );
    }
    if (step === "consent") {
      return (
        <>
          <p className="text-sm text-muted-foreground">Written consent</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Tell {who} before the first ring.</h1>
          <p className="mt-3 text-muted-foreground">
            You cannot say yes for them. The intro call still asks {who} for a spoken haan.
          </p>
          <label className="mt-6 flex items-start gap-3 text-sm leading-6">
            <input
              type="checkbox"
              className="mt-1 size-5"
              checked={Boolean(form.toldParent)}
              onChange={(e) => patch("toldParent", e.target.checked)}
            />
            <span>{CHILD_WRITTEN_TEXT}</span>
          </label>
        </>
      );
    }
    return (
      <>
        <p className="text-sm text-muted-foreground">You&apos;re set</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Saathi will call {who} tomorrow at {clockLabel(form.callTime)}.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Today starts empty on purpose. Nothing rings a real phone until outbound is switched on and this number is
          on the allowlist.
        </p>
      </>
    );
  }, [step, form, email, signedEmail, langs, sent, who]);

  const primary = (() => {
    if (step === "sign") return { label: sent ? "Waiting for the email" : saving ? "…" : "Continue", action: signIn, disabled: sent || saving };
    if (step === "medicines") {
      return { label: form.medicines.length ? "Continue" : "She doesn't take a daily tablet", action: next, disabled: saving };
    }
    if (step === "neighbour") {
      return { label: form.neighborName.trim() ? "Continue" : "Skip for now", action: next, disabled: saving };
    }
    if (step === "consent") return { label: saving ? "Saving…" : "Looks right", action: submit, disabled: saving };
    if (step === "done") {
      return {
        label: "Open the family desk",
        action: () => token && router.push(`/d/${token}`),
        disabled: !token,
      };
    }
    return { label: "Continue", action: next, disabled: saving };
  })();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-4 py-8">
      <div className="flex items-center gap-3">
        {step !== "done" && step !== "sign" ? (
          <button type="button" onClick={back} className="inline-flex h-11 min-w-11 items-center text-sm font-medium">
            Back
          </button>
        ) : (
          <span className="h-11" />
        )}
        <span className="flex-1" />
        <Link href="/d/example-kamla" className="text-sm text-muted-foreground">
          Example
        </Link>
      </div>
      <div className="flex-1 pt-4 pb-8">{body}</div>
      {error ? (
        <p className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="button" disabled={primary.disabled} className="h-12 w-full" onClick={primary.action}>
        {primary.label}
      </Button>
    </div>
  );
}

function replaceMed(list: ParsedMedicine[], index: number, next: ParsedMedicine) {
  return list.map((item, i) => (i === index ? next : item));
}

function toHousehold(form: OnboardInput): Household {
  const language = (LANGUAGE_OPTIONS.find((o) => o.code === form.languages[0])?.label ?? "Hindi") as Language;
  const relation = (ADDRESS_TERMS.includes(form.addressTerm as (typeof ADDRESS_TERMS)[number])
    ? form.addressTerm
    : "Amma") as Relation;
  return {
    childName: form.childName,
    childWhatsapp: form.childWhatsapp,
    parentName: form.parentName,
    relation,
    parentPhone: form.parentPhone,
    city: form.city,
    language,
    callTime: form.callTime,
    medicines: form.medicines.map((m) => m.name).join(", "),
    neighborName: form.neighborName,
    neighborPhone: form.neighborPhone,
    parentConsented: Boolean(form.toldParent),
    paused: false,
  };
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center rounded-2xl border px-3 text-sm",
        on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
      )}
    >
      {children}
    </button>
  );
}
