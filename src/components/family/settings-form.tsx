"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CALL_TIMES, LANGUAGE_OPTIONS } from "@/lib/onboard-form";
import type { Lang } from "@/lib/i18n/messages";

type Med = { id: string; name: string; meal: string; time_local: string | null };

export function SettingsForm({
  token,
  lang,
  callTime,
  languages,
  neighbourName,
  neighbourPhone,
  medicines,
  saveLabel,
  nextCallHint,
}: {
  token: string;
  lang: Lang;
  callTime: string;
  languages: string;
  neighbourName: string;
  neighbourPhone: string;
  medicines: Med[];
  saveLabel: string;
  nextCallHint: string;
}) {
  const router = useRouter();
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
      setNote(nextCallHint);
      router.refresh();
    } catch {
      setError("Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}
      {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          post({ action: "call_time", callTime: String(fd.get("callTime") || "") });
        }}
      >
        <Label htmlFor="callTime">{lang === "hi" ? "सुबह का समय" : "Morning time"}</Label>
        <select
          id="callTime"
          name="callTime"
          defaultValue={callTime}
          className="h-12 w-full rounded-2xl border border-input bg-transparent px-3 text-base"
        >
          {CALL_TIMES.map((time) => (
            <option key={time} value={time}>
              {time} IST
            </option>
          ))}
          {CALL_TIMES.includes(callTime as (typeof CALL_TIMES)[number]) ? null : (
            <option value={callTime}>{callTime} IST</option>
          )}
        </select>
        <Button type="submit" disabled={busy} className="h-12 w-full">
          {saveLabel}
        </Button>
      </form>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          post({ action: "languages", languages: fd.getAll("lang").map(String) });
        }}
      >
        <p className="text-sm font-medium">{lang === "hi" ? "भाषाएँ" : "Languages"}</p>
        <div className="flex flex-wrap gap-3">
          {LANGUAGE_OPTIONS.map((opt) => (
            <label key={opt.code} className="inline-flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" name="lang" value={opt.code} defaultChecked={selected.includes(opt.code)} className="size-5" />
              {opt.label}
            </label>
          ))}
        </div>
        <Button type="submit" disabled={busy} className="h-12 w-full">
          {saveLabel}
        </Button>
      </form>

      <ul className="space-y-4">
        {medicines.map((med) => (
          <li key={med.id} className="space-y-2 rounded-2xl border border-border p-3">
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
              <Input name="name" defaultValue={med.name} aria-label="Medicine name" />
              <Input name="time" type="time" defaultValue={med.time_local || "08:30"} aria-label="Medicine time" />
              <select
                name="meal"
                defaultValue={med.meal}
                className="h-12 w-full rounded-2xl border border-input bg-transparent px-3 text-base"
              >
                <option value="with food">With food</option>
                <option value="without food">Without food</option>
                <option value="after breakfast">After breakfast</option>
                <option value="after lunch">After lunch</option>
                <option value="after dinner">After dinner</option>
              </select>
              <Button type="submit" disabled={busy} className="h-12 w-full">
                {saveLabel}
              </Button>
            </form>
            <button
              type="button"
              disabled={busy}
              className="text-sm text-muted-foreground"
              onClick={() => post({ action: "medicine_remove", id: med.id })}
            >
              {lang === "hi" ? "हटाएँ" : "Remove"}
            </button>
          </li>
        ))}
      </ul>
      <form
        className="space-y-2"
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
        <p className="text-sm font-medium">{lang === "hi" ? "गोली जोड़ें" : "Add a tablet"}</p>
        <Input name="name" placeholder="Amlodipine" />
        <Input name="time" type="time" defaultValue={callTime} />
        <select name="meal" className="h-12 w-full rounded-2xl border border-input bg-transparent px-3 text-base">
          <option value="with food">With food</option>
          <option value="without food">Without food</option>
        </select>
        <Button type="submit" disabled={busy} className="h-12 w-full">
          {lang === "hi" ? "जोड़ें" : "Add"}
        </Button>
      </form>

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          post({ action: "neighbour", name: String(fd.get("name") || ""), phone: String(fd.get("phone") || "") });
        }}
      >
        <p className="text-sm font-medium">{lang === "hi" ? "पड़ोसी" : "Neighbour"}</p>
        <Input name="name" defaultValue={neighbourName} placeholder="Sunita" />
        <Input name="phone" defaultValue={neighbourPhone} placeholder="98111 77821" />
        <Button type="submit" disabled={busy} className="h-12 w-full">
          {saveLabel}
        </Button>
      </form>
    </div>
  );
}
