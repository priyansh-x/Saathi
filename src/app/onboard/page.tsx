"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEMO_HOUSEHOLD } from "@/lib/demo-household";
import { useHousehold, writeHousehold } from "@/lib/store";
import type { Household, Language, Relation } from "@/lib/types";
import { cn } from "@/lib/utils";

const relations: Relation[] = ["Amma", "Aai", "Nani", "Papa", "Appa"];
const languages: Language[] = ["Hindi", "Marathi", "Tamil", "Kannada"];

const empty: Household = {
  childName: "",
  childWhatsapp: "",
  parentName: "",
  relation: "Amma",
  parentPhone: "",
  city: "",
  language: "Hindi",
  callTime: "08:30",
  medicines: "",
  neighborName: "",
  neighborPhone: "",
  parentConsented: false,
  paused: false,
};

export default function OnboardPage() {
  const router = useRouter();
  const saved = useHousehold();
  const [draft, setDraft] = useState<Household | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const form = draft ?? saved ?? empty;

  function set<K extends keyof Household>(key: K, value: Household[K]) {
    setDraft({ ...form, [key]: value });
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!form.childName.trim() || !form.childWhatsapp.trim()) {
      setError("Add your name and WhatsApp number — you are the one who gets the briefing.");
      return;
    }
    if (!form.parentName.trim() || !form.parentPhone.trim()) {
      setError("Parent name and phone are required. This is the number the agent will ring.");
      return;
    }
    if (!form.neighborName.trim() || !form.neighborPhone.trim()) {
      setError("A neighbour who can knock is required. Missed calls are the safety feature.");
      return;
    }
    if (!form.medicines.trim()) {
      setError("Write the morning tablet in plain language, the way they would say it.");
      return;
    }
    if (!form.parentConsented) {
      setError("The parent has to know this number will call. Do not enrol them in secret.");
      return;
    }
    setSaving(true);
    writeHousehold(form);
    router.push("/family");
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <p className="text-sm text-muted-foreground">Once. About four minutes.</p>
      <h1 className="mt-2 font-heading text-3xl tracking-tight">Who should we call?</h1>
      <p className="mt-3 text-muted-foreground">
        You fill this in. They only have to pick up. Hindi is the voice we ship first;
        English sits under every line so you can follow.
      </p>

      <div className="mt-6">
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          onClick={() => setDraft(DEMO_HOUSEHOLD)}
        >
          Fill Kamala’s demo household
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-8">
        <fieldset className="space-y-4">
          <legend className="font-medium">You</legend>
          <Field label="Your name" htmlFor="childName">
            <Input
              id="childName"
              value={form.childName}
              onChange={(e) => set("childName", e.target.value)}
              placeholder="Ananya"
            />
          </Field>
          <Field label="Your WhatsApp" htmlFor="childWhatsapp">
            <Input
              id="childWhatsapp"
              value={form.childWhatsapp}
              onChange={(e) => set("childWhatsapp", e.target.value)}
              placeholder="98765 44110"
            />
          </Field>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-medium">Your parent</legend>
          <Field label="Full name" htmlFor="parentName">
            <Input
              id="parentName"
              value={form.parentName}
              onChange={(e) => set("parentName", e.target.value)}
              placeholder="Kamala Iyer"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="What you call them" htmlFor="relation">
              <select
                id="relation"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={form.relation}
                onChange={(e) => set("relation", e.target.value as Relation)}
              >
                {relations.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Language of the call" htmlFor="language">
              <select
                id="language"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={form.language}
                onChange={(e) => set("language", e.target.value as Language)}
              >
                {languages.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Their phone" htmlFor="parentPhone">
              <Input
                id="parentPhone"
                value={form.parentPhone}
                onChange={(e) => set("parentPhone", e.target.value)}
                placeholder="98450 22118"
              />
            </Field>
            <Field label="City" htmlFor="city">
              <Input
                id="city"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Coimbatore"
              />
            </Field>
          </div>
          <Field label="Call time (their morning)" htmlFor="callTime">
            <Input
              id="callTime"
              type="time"
              value={form.callTime}
              onChange={(e) => set("callTime", e.target.value)}
            />
          </Field>
          <Field label="Medicines, as they would say them" htmlFor="medicines">
            <Textarea
              id="medicines"
              value={form.medicines}
              onChange={(e) => set("medicines", e.target.value)}
              placeholder="Amlodipine 5mg after breakfast, the small white tablet"
            />
          </Field>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-medium">Someone who can knock</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Neighbour’s name" htmlFor="neighborName">
              <Input
                id="neighborName"
                value={form.neighborName}
                onChange={(e) => set("neighborName", e.target.value)}
                placeholder="Lakshmi"
              />
            </Field>
            <Field label="Neighbour’s phone" htmlFor="neighborPhone">
              <Input
                id="neighborPhone"
                value={form.neighborPhone}
                onChange={(e) => set("neighborPhone", e.target.value)}
                placeholder="98450 77821"
              />
            </Field>
          </div>
        </fieldset>

        <label className="flex items-start gap-3 text-sm leading-6">
          <input
            type="checkbox"
            className="mt-1"
            checked={form.parentConsented}
            onChange={(e) => set("parentConsented", e.target.checked)}
          />
          <span>
            They know this number will call, and they have agreed. I will not use
            this to watch them without saying so.
          </span>
        </label>

        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" disabled={saving} className="h-10 px-4">
            {saving ? "Saving…" : "Save and open family desk"}
          </Button>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
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
