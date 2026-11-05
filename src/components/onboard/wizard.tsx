"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import setupImg from "../../../public/images/setup-child-phone.jpg";
import neighbourImg from "../../../public/images/neighbour-knock.jpg";
import { ChevronLeft } from "lucide-react";
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
import { saveDeskToken } from "@/lib/storage";
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

export function OnboardWizard({ lang, fromEmail = "" }: { lang: Lang; fromEmail?: string }) {
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
  // Hold the first frame until we know if they're signed in, so the sign-in step never flashes.
  const [checked, setChecked] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLDivElement>(null);
  const firstStep = useRef(true);
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

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
      .catch(() => undefined)
      .finally(() => setChecked(true));
  }, []);

  // Each step starts at the top, with focus on its content for screen readers.
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    scroller.current?.scrollTo({ top: 0 });
    heading.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
  }, [step]);

  // Hardware / browser back walks the wizard backwards instead of leaving it.
  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const target = (event.state as { saathiStep?: Step } | null)?.saathiStep;
      if (!target) return;
      // Setup is finished: skip the old wizard entries instead of re-entering them.
      if (stepRef.current === "done") {
        window.history.back();
        return;
      }
      setError(null);
      setStep(target);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
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
      goTo("you");
    } catch {
      setError(t.setupSignFail);
    } finally {
      setSaving(false);
    }
  }

  function goTo(nextStep: Step) {
    setError(null);
    // Sign-in is a one-way door: replace it so back never lands on the code screen again.
    const state = { ...(window.history.state ?? {}), saathiStep: nextStep };
    if (step === "sign" || nextStep === "done") window.history.replaceState(state, "");
    else window.history.pushState(state, "");
    setStep(nextStep);
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
          goTo("you");
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
      goTo("you");
    } catch {
      setError(t.setupSignFail);
    } finally {
      setSaving(false);
    }
  }

  function next() {
    const i = FLOW.indexOf(step);
    if (i >= 0 && i < FLOW.length - 1) goTo(FLOW[i + 1]!);
  }

  const canGoBack = step !== "done" && step !== "sign" && !(step === "you" && signedEmail);

  function back() {
    if (!canGoBack) return;
    // Let the history entry pushed for this step drive it, so Android back and this button agree.
    if ((window.history.state as { saathiStep?: Step } | null)?.saathiStep === step) {
      window.history.back();
      return;
    }
    const i = FLOW.indexOf(step);
    if (i > 0) {
      setError(null);
      setStep(FLOW[i - 1]!);
    }
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
      saveDeskToken(data.token);
      sessionStorage.removeItem(DRAFT_KEY);
      setToken(data.token);
      goTo("done");
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
          <div className="relative -mx-4 mb-6 aspect-[4/3] overflow-hidden rounded-3xl">
            <Image src={setupImg} alt="Setting up a morning call on a phone at home" fill priority className="object-cover" sizes="(max-width: 480px) 100vw, 480px" />
          </div>
          <p className="eyebrow">{t.setupSignKicker}</p>
          <h1 tabIndex={-1} className="app-title mt-2 outline-none">{t.setupSignTitle}</h1>
          <p className="mt-3 text-muted-foreground">
            {fromEmail ? t.setupSignBodyFrom.replace("{email}", fromEmail) : t.setupSignBody}
          </p>
          <div className="mt-6">
            <Field label={t.setupEmail} htmlFor="email">
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                enterKeyHint="go"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
          </div>
          {sent ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm">
                {fromEmail ? t.setupCheckInboxFrom.replace("{email}", fromEmail) : t.setupCheckInbox}
              </p>
              <Field label={lang === "hi" ? "ईमेल वाला कोड" : "Code from the email"} htmlFor="code">
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="000000"
                  enterKeyHint="go"
                  autoFocus
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
          <h1 tabIndex={-1} className="app-title mt-2 outline-none">{t.setupYouTitle}</h1>
          <div className="mt-6 space-y-4">
            <Field label={t.setupYourName} htmlFor="childName">
              <Input
                id="childName"
                autoComplete="given-name"
                enterKeyHint="next"
                value={form.childName}
                onChange={(e) => patch("childName", e.target.value)}
                placeholder="Ananya"
              />
            </Field>
            <Field label={t.setupYourWhatsapp} htmlFor="childWhatsapp" hint={t.setupWhatsappHint}>
              <Input
                id="childWhatsapp"
                aria-describedby="childWhatsapp-hint"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
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
          <h1 tabIndex={-1} className="app-title mt-2 outline-none">{t.setupParentTitle}</h1>
          <div className="mt-6 space-y-4">
            <Field label={t.setupFullName} htmlFor="parentName">
              <Input
                id="parentName"
                autoComplete="off"
                value={form.parentName}
                onChange={(e) => patch("parentName", e.target.value)}
                placeholder="Kamla Sharma"
              />
            </Field>
            <Field label={t.setupWhatYouCall} htmlFor="addressTerm">
              <div id="addressTerm" role="group" className="flex flex-wrap gap-2">
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
                type="tel"
                inputMode="tel"
                autoComplete="off"
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
          <h1 tabIndex={-1} className="app-title mt-2 outline-none">{fill(t.setupMorningTitle, { who })}</h1>
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
          <h1 tabIndex={-1} className="app-title mt-2 outline-none">{t.setupMedsTitle}</h1>
          <p className="mt-3 text-muted-foreground">{t.setupMedsBody}</p>
          <ul className="mt-6 space-y-4">
            {form.medicines.map((med, index) => (
              <li key={index} className="card space-y-3 p-4">
                <Field label={t.setupMedName} htmlFor={`med-name-${index}`}>
                  <Input
                    id={`med-name-${index}`}
                    autoComplete="off"
                    autoFocus={!med.name && index === form.medicines.length - 1}
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
                  className="btn-quiet -ml-3 text-alert"
                  onClick={() => patch("medicines", form.medicines.filter((_, i) => i !== index))}
                >
                  {t.setupRemove}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn-secondary mt-4"
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
          <div className="relative -mx-4 mb-6 aspect-[4/3] overflow-hidden rounded-3xl">
            <Image src={neighbourImg} alt="A neighbour at the door, the person who can knock if a call is missed" fill className="object-cover" sizes="(max-width: 480px) 100vw, 480px" />
          </div>
          <p className="eyebrow">{t.setupMedsKicker}</p>
          <h1 tabIndex={-1} className="app-title mt-2 outline-none">{t.setupNeighbourTitle}</h1>
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
                type="tel"
                inputMode="tel"
                autoComplete="off"
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
          <h1 tabIndex={-1} className="app-title mt-2 outline-none">{fill(t.setupConsentTitle, { who })}</h1>
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
        <h1 tabIndex={-1} className="app-title mt-2 outline-none">
          {fill(t.setupDoneTitle, { who, time: clockLabel(form.callTime) })}
        </h1>
        <p className="mt-3 text-muted-foreground">{t.setupDoneBody}</p>
      </>
    );
  }, [step, form, email, signedEmail, langs, sent, code, who, t, lang, fromEmail]);

  const primary = (() => {
    if (step === "sign") {
      if (sent) {
        return {
          label: saving ? t.opening : lang === "hi" ? "कोड डालें" : "Enter the code",
          action: verifyCode,
          disabled: saving || code.length < 6,
        };
      }
      return { label: saving ? t.opening : t.setupContinue, action: signIn, disabled: saving || !email.trim() };
    }
    if (step === "you") {
      return {
        label: t.setupContinue,
        action: next,
        disabled: saving || !form.childName.trim() || form.childWhatsapp.replace(/\D/g, "").length < 10,
      };
    }
    if (step === "parent") {
      return {
        label: t.setupContinue,
        action: next,
        disabled: saving || !form.parentName.trim() || form.parentPhone.replace(/\D/g, "").length < 10,
      };
    }
    if (step === "medicines") {
      return {
        label: form.medicines.length ? t.setupContinue : t.setupNoTablet,
        action: next,
        disabled: saving || form.medicines.some((med) => !med.name.trim()),
      };
    }
    if (step === "neighbour") {
      return { label: form.neighborName.trim() ? t.setupContinue : t.setupSkip, action: next, disabled: saving };
    }
    if (step === "consent") {
      return { label: saving ? t.saving : t.setupLooksRight, action: submit, disabled: saving || !form.toldParent };
    }
    if (step === "done") {
      return {
        label: t.setupOpenDesk,
        action: () => token && router.push(`/d/${token}?lang=${lang}`),
        disabled: !token,
      };
    }
    return { label: t.setupContinue, action: next, disabled: saving };
  })();

  const stepIndex = FLOW.indexOf(step);
  const showProgress = step !== "sign" && step !== "done";

  return (
    <form
      noValidate
      className={`app-shell ${lang === "hi" ? "font-devanagari" : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (!primary.disabled) void primary.action();
      }}
    >
      <div
        className="flex shrink-0 flex-wrap items-center gap-2 px-4"
        style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
      >
        {canGoBack ? (
          <button type="button" onClick={back} className="btn-quiet -ml-3 gap-0.5 pl-2 text-brand-text">
            <ChevronLeft className="size-5" aria-hidden />
            {t.setupBack}
          </button>
        ) : (
          <BrandMark />
        )}
        <span className="flex-1" />
        <Link href={`/onboard?lang=${other}`} className="btn-quiet text-brand-text">
          {lang === "en" ? "हिं" : "EN"}
        </Link>
      </div>
      {showProgress ? (
        <div className="shrink-0 px-4 pt-2">
          <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={FLOW.length - 1}
            aria-valuenow={stepIndex}
            aria-label={t.stepOf.replace("{n}", String(stepIndex)).replace("{total}", String(FLOW.length - 1))}
            className="h-1 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
              style={{ width: `${(stepIndex / (FLOW.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      ) : null}
      <div ref={scroller} className="app-shell-scroll px-4 pt-4 pb-4">
        <div ref={heading}>
          {checked ? (
            body
          ) : (
            <div aria-busy className="space-y-4">
              <div className="aspect-[4/3] animate-pulse rounded-3xl bg-muted" />
              <div className="h-8 w-3/4 animate-pulse rounded-full bg-muted" />
              <div className="h-12 animate-pulse rounded-2xl bg-muted" />
            </div>
          )}
        </div>
      </div>
      {error ? (
        <p
          role="alert"
          className="mx-4 mb-3 rounded-xl bg-alert-soft px-3 py-2 text-sm text-alert"
        >
          {error}
        </p>
      ) : null}
      <div className="shrink-0 px-4 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button
          type={step === "done" ? "button" : "submit"}
          disabled={primary.disabled || !checked}
          aria-busy={saving}
          className="btn-primary"
          onClick={step === "done" ? primary.action : undefined}
        >
          {primary.label}
        </button>
      </div>
    </form>
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
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? (
        <p id={hintId} className="text-[13px] leading-snug text-muted-foreground">
          {hint}
        </p>
      ) : null}
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
