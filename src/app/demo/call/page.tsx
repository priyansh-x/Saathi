"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { makeCallRecord } from "@/lib/call-record";
import { DEMO_HOUSEHOLD } from "@/lib/demo-household";
import { firstName } from "@/lib/names";
import { OUTCOME_LABEL, outcomeClass } from "@/lib/outcomes";
import { buildBeats, closingLine, outcomeFrom } from "@/lib/script";
import { speakHindi, stopSpeaking } from "@/lib/speak";
import type { CallFlag, CallRecord, TranscriptLine } from "@/lib/types";
import { cn } from "@/lib/utils";

type Phase = "idle" | "ringing" | "retry" | "talk" | "done";

const household = DEMO_HOUSEHOLD;

export default function DemoCallPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [beatIndex, setBeatIndex] = useState(0);
  const [flags, setFlags] = useState<CallFlag[]>([]);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [record, setRecord] = useState<CallRecord | null>(null);
  const clock = useRef({ startedAt: 0 });

  const beats = useMemo(() => buildBeats(household), []);
  const beat = beats[beatIndex];
  const parent = firstName(household.parentName);

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
    const afterParent: TranscriptLine[] = [
      ...transcript,
      { speaker: "parent", hi: choice.hi, en: choice.en },
    ];
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
      <p className="text-center text-sm text-muted-foreground">EXAMPLE · offline practice</p>
      <p className="mt-1 text-center text-sm text-muted-foreground">
        Truecaller would read: {household.childName} ne bheja
      </p>

      <div className="mt-4 rounded-2xl border border-border bg-card px-5 py-8">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {household.parentPhone}
        </p>
        <h1 className="mt-2 text-center text-3xl font-semibold tracking-tight">
          {household.parentName}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">{household.city} · incoming</p>

        {phase === "idle" ? (
          <div className="mt-10 space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              You are about to hear the call {parent} would get after tea. Answer as them, or let
              it ring.
            </p>
            <button
              type="button"
              onClick={startRing}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base text-white"
            >
              Place the morning call
            </button>
          </div>
        ) : null}

        {phase === "ringing" ? (
          <div className="mt-10 space-y-4 text-center">
            <p className="text-sm">Ringing…</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={answer}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-white"
              >
                Answer as {parent}
              </button>
              <button
                type="button"
                onClick={missFirst}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border"
              >
                Let it ring
              </button>
            </div>
          </div>
        ) : null}

        {phase === "retry" ? (
          <div className="mt-10 space-y-2 text-center">
            <p className="font-medium">No answer</p>
            <p className="text-sm text-muted-foreground">
              Next try in 10 minutes. After +25 and +45, {household.neighborName} ji is asked to
              knock if nobody acked.
            </p>
            <p className="pt-4 text-sm">Second ring going out…</p>
          </div>
        ) : null}

        {phase === "talk" && beat ? (
          <div className="mt-8 space-y-5">
            <Line speaker="agent" hi={beat.hi} en={beat.en} />
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">You are {parent}. Answer:</p>
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
                {OUTCOME_LABEL[record.outcome]}
              </span>
            </div>
            <p className="text-center text-sm leading-6">{record.summaryEn}</p>
            <div className="flex flex-col gap-2">
              <Link
                href="/d/example-kamla"
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-white"
              >
                Open the briefing
              </Link>
              <button
                type="button"
                onClick={() => setPhase("idle")}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border"
              >
                Call again
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
}: {
  speaker: "agent" | "parent";
  hi: string;
  en: string;
}) {
  return (
    <div className="rounded-xl bg-accent px-3 py-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {speaker === "agent" ? "Agent" : "Parent"}
      </p>
      <p className="font-devanagari mt-1 leading-7">{hi}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{en}</p>
    </div>
  );
}
