"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messages, type Lang } from "@/lib/i18n/messages";
import { CALL_TIMES, LANGUAGE_OPTIONS } from "@/lib/onboard-form";

type Med = { id: string; name: string; meal: string; time_local: string | null };

const fieldClass = "field";

const MEALS = [
  { value: "with food", en: "With food", hi: "खाने के साथ" },
  { value: "without food", en: "Without food", hi: "खाने के बिना" },
  { value: "after breakfast", en: "After breakfast", hi: "नाश्ते के बाद" },
  { value: "after lunch", en: "After lunch", hi: "दोपहर के खाने के बाद" },
  { value: "after dinner", en: "After dinner", hi: "रात के खाने के बाद" },
] as const;

type Section = "call" | "meds" | "neighbour";
type Status = { section: Section; kind: "ok" | "error"; text: string } | null;

function SectionStatus({ status, section }: { status: Status; section: Section }) {
  if (!status || status.section !== section) return null;
  return (
    <p
      role={status.kind === "error" ? "alert" : "status"}
      className={`rounded-xl px-3 py-2 text-sm ${
        status.kind === "error" ? "bg-alert-soft text-alert" : "bg-good-soft text-good"
      }`}
    >
      {status.text}
    </p>
  );
}

function MealOptions({ lang }: { lang: Lang }) {
  return (
    <>
      {MEALS.map((meal) => (
        <option key={meal.value} value={meal.value}>
          {meal[lang]}
        </option>
      ))}
    </>
  );
}

export function SettingsForm({
  token,
  lang,
  callTime,
  languages,
  neighbourName,
  neighbourPhone,
  medicines,
}: {
  token: string;
  lang: Lang;
  callTime: string;
  languages: string;
  neighbourName: string;
  neighbourPhone: string;
  medicines: Med[];
}) {
  const router = useRouter();
  const t = messages[lang];
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState<Section | null>(null);
  const selected = languages.split(",").map((c) => c.trim()).filter(Boolean);

  /** Send one or more changes in order; stop at the first failure. Feedback lands next to the section. */
  async function post(section: Section, ...bodies: Record<string, unknown>[]) {
    setBusy(section);
    setStatus(null);
    try {
      for (const body of bodies) {
        const res = await fetch(`/api/d/${token}/settings`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!res.ok) {
          setStatus({ section, kind: "error", text: data.error || t.couldNotSave });
          return false;
        }
      }
      setStatus({ section, kind: "ok", text: t.saved });
      router.refresh();
      return true;
    } catch {
      setStatus({ section, kind: "error", text: t.couldNotSave });
      return false;
    } finally {
      setBusy(null);
    }
  }

  const saving = busy !== null;

  return (
    <div className="space-y-6">

      <section className="card space-y-4 px-4 py-4">
        <h2 className="font-semibold">{t.callSection}</h2>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const picked = fd.getAll("lang").map(String);
            if (picked.length === 0) {
              setStatus({ section: "call", kind: "error", text: t.pickOneLanguage });
              return;
            }
            await post(
              "call",
              { action: "call_time", callTime: String(fd.get("callTime") || "") },
              { action: "languages", languages: picked },
            );
          }}
        >
          <Label htmlFor="callTime">{t.morningTime}</Label>
          <select id="callTime" name="callTime" defaultValue={callTime} className={fieldClass}>
            {CALL_TIMES.map((time) => (
              <option key={time} value={time}>
                {time} IST
              </option>
            ))}
            {CALL_TIMES.includes(callTime as (typeof CALL_TIMES)[number]) ? null : (
              <option value={callTime}>{callTime} IST</option>
            )}
          </select>
          <fieldset>
          <legend className="mb-2 text-sm font-medium">{t.languagesLabel}</legend>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((opt) => (
              <label key={opt.code} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-sm has-[:checked]:border-foreground">
                <input type="checkbox" name="lang" value={opt.code} defaultChecked={selected.includes(opt.code)} className="size-4 accent-[var(--primary)]" />
                {opt.code === "hi" ? (lang === "hi" ? "हिंदी" : "Hindi") : opt.code === "en" ? (lang === "hi" ? "अंग्रेज़ी" : "English") : opt.code === "mr" ? (lang === "hi" ? "मराठी" : "Marathi") : opt.label}
              </label>
            ))}
          </div>
          </fieldset>
          <SectionStatus status={status} section="call" />
          <button type="submit" disabled={saving} className="btn-secondary">
            {busy === "call" ? t.saving : t.saveTime}
          </button>
        </form>
        <p className="text-sm text-muted-foreground">{t.settingsHint}</p>
      </section>

      <section className="card space-y-4 px-4 py-4">
        <h2 className="font-semibold">{t.medicinesSection}</h2>
        <p className="text-sm text-muted-foreground">{t.medsDisclaimer}</p>
        <ul className="space-y-4">
          {medicines.map((med) => (
            <li key={med.id} className="space-y-2 border-t border-border pt-4">
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  void post("meds", {
                    action: "medicine_edit",
                    id: med.id,
                    name: String(fd.get("name") || ""),
                    time: String(fd.get("time") || ""),
                    meal: String(fd.get("meal") || ""),
                  });
                }}
              >
                <p className="text-[15px] font-semibold">{med.name}</p>
                <Label htmlFor={`med-${med.id}`}>{t.medName}</Label>
                <Input id={`med-${med.id}`} name="name" defaultValue={med.name} required autoComplete="off" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`med-time-${med.id}`}>{t.medTime}</Label>
                    <Input id={`med-time-${med.id}`} name="time" type="time" defaultValue={med.time_local || "08:30"} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`med-meal-${med.id}`}>{t.medMeal}</Label>
                    <select id={`med-meal-${med.id}`} name="meal" defaultValue={med.meal} className={fieldClass}>
                      <MealOptions lang={lang} />
                      {MEALS.some((m) => m.value === med.meal) ? null : <option value={med.meal}>{med.meal}</option>}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={saving}
                    className="btn-quiet -ml-3 text-alert"
                    onClick={() => {
                      if (!window.confirm(t.confirmRemoveMed.replace("{name}", med.name))) return;
                      void post("meds", { action: "medicine_remove", id: med.id });
                    }}
                  >
                    {t.remove}
                  </button>
                  <button type="submit" disabled={saving} className="btn-secondary w-auto min-w-28 px-4">
                    {busy === "meds" ? t.saving : t.saveChanges}
                  </button>
                </div>
              </form>
            </li>
          ))}
        </ul>
        <form
          className="space-y-2 border-t border-border pt-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const formEl = e.currentTarget;
            const fd = new FormData(formEl);
            const ok = await post("meds", {
              action: "medicine_add",
              name: String(fd.get("name") || "").trim(),
              time: String(fd.get("time") || callTime),
              meal: String(fd.get("meal") || "with food"),
            });
            if (ok) formEl.reset();
          }}
        >
          <p className="text-[15px] font-semibold">{t.addTablet}</p>
          <Label htmlFor="med-new">{t.medName}</Label>
          <Input id="med-new" name="name" placeholder="Amlodipine" required autoComplete="off" />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="med-new-time">{t.medTime}</Label>
              <Input id="med-new-time" name="time" type="time" defaultValue={callTime} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-new-meal">{t.medMeal}</Label>
              <select id="med-new-meal" name="meal" className={fieldClass}>
                <MealOptions lang={lang} />
              </select>
            </div>
          </div>
          <SectionStatus status={status} section="meds" />
          <button type="submit" disabled={saving} className="btn-secondary">
            {busy === "meds" ? t.saving : t.addTablet}
          </button>
        </form>
      </section>

      <section className="card space-y-3 px-4 py-4">
        <h2 className="font-semibold">{t.neighbour}</h2>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void post("neighbour", {
              action: "neighbour",
              name: String(fd.get("name") || "").trim(),
              phone: String(fd.get("phone") || "").trim(),
            });
          }}
        >
          <Label htmlFor="neighbour-name">{t.neighbourName}</Label>
          <Input id="neighbour-name" name="name" defaultValue={neighbourName} placeholder="Sunita" autoComplete="off" />
          <Label htmlFor="neighbour-phone">{t.neighbourPhone}</Label>
          <Input
            id="neighbour-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={neighbourPhone}
            placeholder="+910000000002"
            autoComplete="off"
          />
          <SectionStatus status={status} section="neighbour" />
          <button type="submit" disabled={saving} className="btn-secondary">
            {busy === "neighbour" ? t.saving : t.saveChanges}
          </button>
        </form>
      </section>
    </div>
  );
}
