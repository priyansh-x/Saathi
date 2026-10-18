"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messages, type Lang } from "@/lib/i18n/messages";
import { CALL_TIMES, LANGUAGE_OPTIONS } from "@/lib/onboard-form";

type Med = { id: string; name: string; meal: string; time_local: string | null };

const fieldClass = "h-12 w-full rounded-xl border border-input bg-card px-3 text-base";

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
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const selected = languages.split(",").map((c) => c.trim()).filter(Boolean);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch(`/api/d/${token}/settings`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error || "Could not save.");
        return;
      }
      setNote(t.settingsHint);
      router.refresh();
    } catch {
      setError("Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}
      {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}

      <section className="space-y-4 rounded-2xl border border-border bg-card px-4 py-4">
        <h2 className="font-semibold">{t.callSection}</h2>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            post({ action: "call_time", callTime: String(fd.get("callTime") || "") });
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
          <Button type="submit" variant="outline" disabled={busy} className="h-12 w-full rounded-xl">
            {t.saveTime}
          </Button>
        </form>
        <form
          className="space-y-3 border-t border-border pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            post({ action: "languages", languages: fd.getAll("lang").map(String) });
          }}
        >
          <p className="text-sm font-medium">{t.languagesLabel}</p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((opt) => (
              <label key={opt.code} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm">
                <input type="checkbox" name="lang" value={opt.code} defaultChecked={selected.includes(opt.code)} className="size-4" />
                {opt.label}
              </label>
            ))}
          </div>
          <Button type="submit" variant="outline" disabled={busy} className="h-12 w-full rounded-xl">
            {t.saveLanguages}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">{t.settingsHint}</p>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card px-4 py-4">
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
                  post({
                    action: "medicine_edit",
                    id: med.id,
                    name: String(fd.get("name") || ""),
                    time: String(fd.get("time") || ""),
                    meal: String(fd.get("meal") || ""),
                  });
                }}
              >
                <Label htmlFor={`med-${med.id}`}>{med.name}</Label>
                <Input id={`med-${med.id}`} name="name" defaultValue={med.name} />
                <Input name="time" type="time" defaultValue={med.time_local || "08:30"} aria-label={t.morningTime} />
                <select name="meal" defaultValue={med.meal} className={fieldClass} aria-label={med.name}>
                  <option value="with food">With food</option>
                  <option value="without food">Without food</option>
                  <option value="after breakfast">After breakfast</option>
                  <option value="after lunch">After lunch</option>
                  <option value="after dinner">After dinner</option>
                </select>
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    className="text-sm text-muted-foreground underline-offset-2 hover:underline"
                    onClick={() => post({ action: "medicine_remove", id: med.id })}
                  >
                    {t.remove}
                  </button>
                  <Button type="submit" variant="outline" disabled={busy} className="h-11 rounded-xl px-4">
                    {t.saveChanges}
                  </Button>
                </div>
              </form>
            </li>
          ))}
        </ul>
        <form
          className="space-y-2 border-t border-border pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            post({
              action: "medicine_add",
              name: String(fd.get("name") || ""),
              time: String(fd.get("time") || callTime),
              meal: String(fd.get("meal") || "with food"),
            });
            e.currentTarget.reset();
          }}
        >
          <p className="text-sm font-medium">{t.addTablet}</p>
          <Input name="name" placeholder="Amlodipine" aria-label={t.addTablet} />
          <Input name="time" type="time" defaultValue={callTime} aria-label={t.morningTime} />
          <select name="meal" className={fieldClass}>
            <option value="with food">With food</option>
            <option value="without food">Without food</option>
          </select>
          <Button type="submit" variant="outline" disabled={busy} className="h-12 w-full rounded-xl">
            {t.addTablet}
          </Button>
        </form>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card px-4 py-4">
        <h2 className="font-semibold">{t.neighbour}</h2>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            post({ action: "neighbour", name: String(fd.get("name") || ""), phone: String(fd.get("phone") || "") });
          }}
        >
          <Input name="name" defaultValue={neighbourName} placeholder="Sunita" aria-label={t.neighbour} />
          <Input name="phone" defaultValue={neighbourPhone} placeholder="98111 77821" aria-label={t.neighbour} />
          <Button type="submit" variant="outline" disabled={busy} className="h-12 w-full rounded-xl">
            {t.saveChanges}
          </Button>
        </form>
      </section>
    </div>
  );
}
