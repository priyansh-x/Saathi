"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import setupImg from "../../../public/images/setup-child-phone.jpg";
import neighbourImg from "../../../public/images/neighbour-knock.jpg";
import { BrandMark } from "@/components/brand";
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
import { messages, localeWord, type Lang } from "@/lib/i18n/messages";
import { writeHousehold } from "@/lib/store";
import type { Household, Language, Relation } from "@/lib/types";

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

function fill(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

export function OnboardWizard({ lang }: { lang: Lang }) {
  const router = useRouter();
  const t = messages[lang];
  const other = lang === "hi" ? "en" : "hi";
  const [step, setStep] = useState<Step>("sign");
  const [form, setForm] = useState<OnboardInput>(loadDraft);
  const [email, setEmail] = useState("");
  const [signedEmail, setSignedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");

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

  async function verifyCode() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error || (lang === "hi" ? "कोड नहीं चला।" : "That code did not work."));
        return;
      }
      setSignedEmail(email.trim().toLowerCase());
      setStep("you");
    } catch {
      setError(t.setupSignFail);
    } finally {
      setSaving(false);
    }
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
        if (data.error === "Email sign-in is not configured.") {
          setSignedEmail(email.trim().toLowerCase());
          setStep("you");
          return;
        }
        setError(data.error || t.setupSignFail);
        return;
      }
      if (data.mode === "email") {
        setSent(true);
        return;
      }
      setSignedEmail(email.trim().toLowerCase());
      setStep("you");
    } catch {
      setError(t.setupSignFail);
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
      setError(t.setupTellFirst);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          toldParent: true,
          email: (signedEmail || email).trim().toLowerCase(),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; token?: string };
      if (!res.ok || !data.token) {
        setError(data.error || t.setupSaveFail);
        return;
      }
      writeHousehold(toHousehold(form));
      sessionStorage.removeItem(DRAFT_KEY);
      setToken(data.token);
      setStep("done");
    } catch {
      setError(t.setupSaveFail);
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
          <div className="grain relative -mx-4 mb-6 aspect-[4/3] overflow-hidden rounded-[28px]">
            <Image src={setupImg} alt="Setting up a morning call on a phone at home" fill priority className="object-cover" sizes="(max-width: 480px) 100vw, 480px" />
          </div>
          <p className="eyebrow">{t.setupSignKicker}</p>
          <h1 className="app-title mt-2">{t.setupSignTitle}</h1>
          <p className="mt-3 text-muted-foreground">{t.setupSignBody}</p>
          <Field label={t.setupEmail} htmlFor="email">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          {sent ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm">{t.setupCheckInbox}</p>
              <p className="text-sm">
                {lang === "hi" ? "ऐप में कोड टाइप करें — ईमेल का लिंक ब्राउज़र खोल देगा।" : "Type the code in this app. The email link opens the phone browser, not Saathi."}
              </p>
              <Field label={lang === "hi" ? "6 अंकों का कोड" : "6-digit code"} htmlFor="code">
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                />
              </Field>
            </div>
          ) : null}
        </>
      );
    }
    if (step === "you") {
      return (
        <>
          <p className="text-sm text-muted-foreground">
            {t.setupYouKicker}
            {signedEmail ? ` · ${signedEmail}` : ""}
          </p>
          <h1 className="app-title mt-2">{t.setupYouTitle}</h1>
          <div className="mt-6 space-y-4">
            <Field label={t.setupYourName} htmlFor="childName">
              <Input
                id="childName"
                value={form.childName}
                onChange={(e) => patch("childName", e.target.value)}
                placeholder="Ananya"
              />
            </Field>
            <Field label={t.setupYourWhatsapp} htmlFor="childWhatsapp">
              <Input
                id="childWhatsapp"
                value={form.childWhatsapp}
                onChange={(e) => patch("childWhatsapp", e.target.value)}
                placeholder="+910000000001"
              />
            </Field>
          </div>
        </>
      );
    }
    if (step === "parent") {
      return (
        <>
          <p className="text-sm text-muted-foreground">{t.setupParentKicker}</p>
          <h1 className="app-title mt-2">{t.setupParentTitle}</h1>
          <div className="mt-6 space-y-4">
            <Field label={t.setupFullName} htmlFor="parentName">
              <Input
                id="parentName"
                value={form.parentName}
                onChange={(e) => patch("parentName", e.target.value)}
                placeholder="Kamla Sharma"
              />
            </Field>
            <Field label={t.setupWhatYouCall} htmlFor="addressTerm">
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
            <Field label={t.setupTheirPhone} htmlFor="parentPhone">
              <Input
                id="parentPhone"
                value={form.parentPhone}
                onChange={(e) => patch("parentPhone", e.target.value)}
                placeholder="+910000000000"
              />
            </Field>
            <Field label={t.setupCity} htmlFor="city">
              <Input id="city" value={form.city} onChange={(e) => patch("city", e.target.value)} placeholder="Delhi" />
            </Field>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">{t.setupCallLanguages}</legend>
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
                    {localeWord(opt.code, lang) === opt.code ? opt.label : localeWord(opt.code, lang)}
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
          <p className="text-sm text-muted-foreground">{t.setupMorningKicker}</p>
          <h1 className="app-title mt-2">{fill(t.setupMorningTitle, { who })}</h1>
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
          <p className="text-sm text-muted-foreground">{t.setupMedsKicker}</p>
          <h1 className="app-title mt-2">{t.setupMedsTitle}</h1>
          <p className="mt-3 text-muted-foreground">{t.setupMedsBody}</p>
          <ul className="mt-6 space-y-4">
            {form.medicines.map((med, index) => (
              <li key={index} className="space-y-2 rounded-2xl border border-border p-3">
                <Field label={t.setupMedName} htmlFor={`med-name-${index}`}>
                  <Input
                    id={`med-name-${index}`}
                    value={med.name}
                    onChange={(e) => patch("medicines", replaceMed(form.medicines, index, { ...med, name: e.target.value }))}
                  />
                </Field>
                <Field label={t.setupMedTime} htmlFor={`med-time-${index}`}>
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
                    {t.setupWithFood}
                  </Chip>
                  <Chip
                    on={!med.withFood}
                    onClick={() => patch("medicines", replaceMed(form.medicines, index, { ...med, withFood: false }))}
                  >
                    {t.setupWithoutFood}
                  </Chip>
                </div>
                <button
                  type="button"
                  className="text-sm text-muted-foreground"
                  onClick={() => patch("medicines", form.medicines.filter((_, i) => i !== index))}
                >
                  {t.setupRemove}
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
            {t.setupAddTablet}
          </button>
        </>
      );
    }
    if (step === "neighbour") {
      return (
        <>
          <div className="grain relative -mx-4 mb-6 aspect-[4/3] overflow-hidden rounded-[28px]">
            <Image src={neighbourImg} alt="A neighbour at the door, the person who can knock if a call is missed" fill className="object-cover" sizes="(max-width: 480px) 100vw, 480px" />
          </div>
          <p className="eyebrow">{t.setupMedsKicker}</p>
          <h1 className="app-title mt-2">{t.setupNeighbourTitle}</h1>
          <p className="mt-3 text-muted-foreground">{t.setupNeighbourBody}</p>
          <div className="mt-6 space-y-4">
            <Field label={t.setupNeighbourName} htmlFor="neighborName">
              <Input
                id="neighborName"
                value={form.neighborName}
                onChange={(e) => patch("neighborName", e.target.value)}
                placeholder="Sunita"
              />
            </Field>
            <Field label={t.setupNeighbourPhone} htmlFor="neighborPhone">
              <Input
                id="neighborPhone"
                value={form.neighborPhone}
                onChange={(e) => patch("neighborPhone", e.target.value)}
                placeholder="+910000000009"
              />
            </Field>
          </div>
        </>
      );
    }
    if (step === "consent") {
      return (
        <>
          <p className="text-sm text-muted-foreground">{t.setupConsentKicker}</p>
          <h1 className="app-title mt-2">{fill(t.setupConsentTitle, { who })}</h1>
          <p className="mt-3 text-muted-foreground">{fill(t.setupConsentBody, { who })}</p>
          <label className="mt-6 flex items-start gap-3 text-sm leading-6">
            <input
              type="checkbox"
              className="mt-1 size-5"
              checked={Boolean(form.toldParent)}
              onChange={(e) => patch("toldParent", e.target.checked)}
            />
            <span>{CHILD_WRITTEN_TEXT}</span>
          </label>
          <p className="mt-4 text-sm">
            <Link href={`/privacy?lang=${lang}`} className="text-primary underline-offset-2 hover:underline">
              {t.setupPrivacyLink}
            </Link>
          </p>
        </>
      );
    }
    return (
      <>
        <p className="text-sm text-muted-foreground">{t.setupDoneKicker}</p>
        <h1 className="app-title mt-2">
          {fill(t.setupDoneTitle, { who, time: clockLabel(form.callTime) })}
        </h1>
        <p className="mt-3 text-muted-foreground">{t.setupDoneBody}</p>
      </>
    );
  }, [step, form, email, signedEmail, langs, sent, code, who, t, lang]);

  const primary = (() => {
    if (step === "sign") {
      if (sent) {
        return {
          label: saving ? "…" : lang === "hi" ? "कोड डालें" : "Type the code",
          action: verifyCode,
          disabled: saving || code.length !== 6,
        };
      }
      return { label: saving ? "…" : t.setupContinue, action: signIn, disabled: saving };
    }
    if (step === "medicines") {
      return { label: form.medicines.length ? t.setupContinue : t.setupNoTablet, action: next, disabled: saving };
    }
    if (step === "neighbour") {
      return { label: form.neighborName.trim() ? t.setupContinue : t.setupSkip, action: next, disabled: saving };
    }
    if (step === "consent") return { label: saving ? "…" : t.setupLooksRight, action: submit, disabled: saving };
    if (step === "done") {
      return {
        label: t.setupOpenDesk,
        action: () => token && router.push(`/d/${token}?lang=${lang}`),
        disabled: !token,
      };
    }
    return { label: t.setupContinue, action: next, disabled: saving };
  })();

  return (
    <div className={`app-shell ${lang === "hi" ? "font-devanagari" : ""}`}>
      <div className="flex shrink-0 flex-wrap items-center gap-2 px-4 pt-8">
        {step !== "done" && step !== "sign" ? (
          <button type="button" onClick={back} className="btn-quiet -ml-3 text-primary">
            {t.setupBack}
          </button>
        ) : (
          <BrandMark />
        )}
        <span className="flex-1" />
        <Link href={`/onboard?lang=${other}`} className="btn-quiet text-primary">
          {lang === "en" ? "हिं" : "EN"}
        </Link>
      </div>
      <div className="app-shell-scroll px-4 pt-4 pb-4">{body}</div>
      {error ? (
        <p className="mx-4 mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="shrink-0 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button type="button" disabled={primary.disabled} className="btn-primary" onClick={primary.action}>
          {primary.label}
        </button>
      </div>
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
      className="choice"
    >
      {children}
    </button>
  );
}
