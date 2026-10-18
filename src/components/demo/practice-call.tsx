"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { makeCallRecord } from "@/lib/call-record";
import { DEMO_HOUSEHOLD } from "@/lib/demo-household";
import { firstName } from "@/lib/names";
import { messages, type Lang } from "@/lib/i18n/messages";
import { OUTCOME_LABEL, outcomeClass } from "@/lib/outcomes";
import { buildBeats, closingLine, outcomeFrom } from "@/lib/script";
import { speakHindi, stopSpeaking } from "@/lib/speak";
import type { CallFlag, CallRecord, TranscriptLine } from "@/lib/types";
import { cn } from "@/lib/utils";

type Phase = "idle" | "ringing" | "retry" | "talk" | "done";

const household = DEMO_HOUSEHOLD;

const COPY = {
  en: {
    kicker: "EXAMPLE · offline practice",
    truecaller: `Truecaller would read: ${household.childName} ne bheja`,
    incoming: "incoming",
    idle: (parent: string) =>
      `You are about to hear the call ${parent} would get after tea. Answer as them, or let it ring.`,
    place: "Place the morning call",
    ringing: "Ringing…",
    answer: (parent: string) => `Answer as ${parent}`,
    letRing: "Let it ring",
    noAnswer: "No answer",
    retryHint: (neighbour: string) =>
      `Next try in 10 minutes. After +25 and +45, ${neighbour} ji is asked to knock if nobody acked.`,
    second: "Second ring going out…",
    youAre: (parent: string) => `You are ${parent}. Answer:`,
    briefing: "Open the briefing",
    again: "Call again",
    agent: "Saathi",
    parent: "Maa",
  },
  hi: {
    kicker: "EXAMPLE · ऑफ़लाइन अभ्यास",
    truecaller: `ट्रूकॉलर पर: ${household.childName} ने भेजा`,
    incoming: "इनकमिंग",
    idle: (parent: string) =>
      `यह कॉल ${parent} को चाय के बाद मिलेगी। उनके जैसा जवाब दें, या बजने दें।`,
    place: "सुबह की कॉल लगाएँ",
    ringing: "घंटी बज रही है…",
    answer: (parent: string) => `${parent} की तरह उठाएँ`,
    letRing: "बजने दें",
    noAnswer: "कोई नहीं उठा",
    retryHint: (neighbour: string) =>
      `दस मिनट में फिर कोशिश। +25 और +45 के बाद अगर कोई जवाब न दे तो ${neighbour} जी से दरवाज़ा खटखटाने को कहा जाता है।`,
    second: "दूसरी घंटी जा रही है…",
    youAre: (parent: string) => `आप ${parent} हैं। जवाब दें:`,
    briefing: "ब्रीफिंग खोलें",
    again: "फिर कॉल करें",
    agent: "साथी",
    parent: "माँ",
  },
} as const;

export function PracticeCall({ lang }: { lang: Lang }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [beatIndex, setBeatIndex] = useState(0);
  const [flags, setFlags] = useState<CallFlag[]>([]);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [record, setRecord] = useState<CallRecord | null>(null);
  const clock = useRef({ startedAt: 0 });
  const t = COPY[lang];
  const ui = messages[lang];
  const other = lang === "hi" ? "en" : "hi";

  const beats = useMemo(() => buildBeats(household), []);
  const beat = beats[beatIndex];
  const parent = firstName(household.parentName);
  const outcomeLabel =
    record == null
      ? ""
      : record.outcome === "ok"
        ? ui.good
        : record.outcome === "emergency"
          ? ui.act
          : ui.look;

  function startRing() {
    clock.current.startedAt = 1;
    setFlags([]);
    setTranscript([]);
    setRecord(null);
    setBeatIndex(0);
    setPhase("ringing");
  }

  function answer() {
    const first = beats[0];
    setPhase("talk");
    setBeatIndex(0);
    if (first) {
      setTranscript([{ speaker: "agent", hi: first.hi, en: first.en }]);
      speakHindi(first.hi);
    }
  }

  function missFirst() {
    setPhase("retry");
    window.setTimeout(() => {
      persist({
        outcome: "missed",
        nextFlags: [],
        lines: [
          {
            speaker: "agent",
            hi: "कोई नहीं उठा। दस मिनट में एक बार और घंटी बजाती हूँ।",
            en: "No answer. I will ring again in ten minutes.",
          },
        ],
      });
    }, 1600);
  }

  function pick(choice: { hi: string; en: string; flags: CallFlag[] }) {
    if (!beat) return;
    const nextFlags = [...flags, ...choice.flags];
    const afterParent: TranscriptLine[] = [...transcript, { speaker: "parent", hi: choice.hi, en: choice.en }];
    const shouldClose = choice.flags.includes("fall") || beatIndex >= beats.length - 1;
    if (shouldClose) {
      const close = closingLine(household, nextFlags);
      persist({
        outcome: outcomeFrom(nextFlags),
        nextFlags,
        lines: [...afterParent, { speaker: "agent", hi: close.hi, en: close.en }],
      });
      speakHindi(close.hi);
      return;
    }
    const upcoming = beats[beatIndex + 1];
    setFlags(nextFlags);
    setBeatIndex((i) => i + 1);
    if (upcoming) {
      setTranscript([...afterParent, { speaker: "agent", hi: upcoming.hi, en: upcoming.en }]);
      speakHindi(upcoming.hi);
    } else {
      setTranscript(afterParent);
    }
  }

  function persist(input: {
    outcome: CallRecord["outcome"];
    nextFlags: CallFlag[];
    lines: TranscriptLine[];
  }) {
    const saved = makeCallRecord({
      household,
      outcome: input.outcome,
      flags: input.nextFlags,
      lines: input.lines,
      startedAt: clock.current.startedAt,
      endedAt: clock.current.startedAt + 24_000,
    });
    setTranscript(input.lines);
    setFlags(input.nextFlags);
    setRecord(saved);
    setPhase("done");
    if (input.outcome === "missed") stopSpeaking();
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <p className="flex items-center justify-center gap-3 text-center text-sm text-muted-foreground">
        {t.kicker}
        <Link href={`/demo/call?lang=${other}`} className="text-primary">
          {lang === "en" ? "हिं" : "EN"}
        </Link>
      </p>
      <p className="mt-1 text-center text-sm text-muted-foreground">{t.truecaller}</p>

      <div className="mt-4 rounded-2xl border border-border bg-card px-5 py-8">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">{household.parentPhone}</p>
        <h1 className="mt-2 text-center text-3xl font-semibold tracking-tight">{household.parentName}</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {household.city} · {t.incoming}
        </p>

        {phase === "idle" ? (
          <div className="mt-10 space-y-3 text-center">
            <p className="text-sm text-muted-foreground">{t.idle(parent)}</p>
            <button
              type="button"
              onClick={startRing}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base text-white"
            >
              {t.place}
            </button>
          </div>
        ) : null}

        {phase === "ringing" ? (
          <div className="mt-10 space-y-4 text-center">
            <p className="text-sm">{t.ringing}</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={answer}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-white"
              >
                {t.answer(parent)}
              </button>
              <button
                type="button"
                onClick={missFirst}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border"
              >
                {t.letRing}
              </button>
            </div>
          </div>
        ) : null}

        {phase === "retry" ? (
          <div className="mt-10 space-y-2 text-center">
            <p className="font-medium">{t.noAnswer}</p>
            <p className="text-sm text-muted-foreground">{t.retryHint(household.neighborName)}</p>
            <p className="pt-4 text-sm">{t.second}</p>
          </div>
        ) : null}

        {phase === "talk" && beat ? (
          <div className="mt-8 space-y-5">
            <Line speaker="agent" hi={beat.hi} en={beat.en} agent={t.agent} parent={t.parent} />
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{t.youAre(parent)}</p>
              {beat.choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => pick(choice)}
                  className="min-h-11 w-full rounded-2xl border border-border bg-background px-3 py-3 text-left"
                >
                  <p className="font-devanagari text-sm">{choice.hi}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{choice.en}</p>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {phase === "done" && record ? (
          <div className="mt-8 space-y-4">
            <div className="flex justify-center">
              <span className={cn("rounded-md px-2 py-1 text-xs font-medium", outcomeClass(record.outcome))}>
                {outcomeLabel || OUTCOME_LABEL[record.outcome]}
              </span>
            </div>
            <p className="text-center text-sm leading-6">{lang === "hi" ? record.summaryHi : record.summaryEn}</p>
            <div className="flex flex-col gap-2">
              <Link
                href={`/d/example-kamla?lang=${lang}`}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-white"
              >
                {t.briefing}
              </Link>
              <button
                type="button"
                onClick={() => setPhase("idle")}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border"
              >
                {t.again}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Line({
  speaker,
  hi,
  en,
  agent,
  parent,
}: {
  speaker: "agent" | "parent";
  hi: string;
  en: string;
  agent: string;
  parent: string;
}) {
  return (
    <div className="rounded-xl bg-accent px-3 py-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {speaker === "agent" ? agent : parent}
      </p>
      <p className="font-devanagari mt-1 leading-7">{hi}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{en}</p>
    </div>
  );
}
