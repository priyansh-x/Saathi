"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { firstName } from "@/lib/names";
import { OUTCOME_LABEL, outcomeClass } from "@/lib/outcomes";
import { useCallLog, useHousehold, useLastCall, writeCall, writeHousehold } from "@/lib/store";
import { useClientReady } from "@/lib/use-client-ready";
import type { CallOutcome, CallRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function FamilyPage() {
  const ready = useClientReady();
  const household = useHousehold();
  const last = useLastCall();
  const log = useCallLog();

  if (!ready) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">
        Opening the desk…
      </main>
    );
  }

  if (!household) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-heading text-3xl tracking-tight">No household yet</h1>
        <p className="mt-3 text-muted-foreground">
          Set up who to call before a briefing can exist. The desk stays empty on
          purpose until then.
        </p>
        <Link href="/onboard" className={cn(buttonVariants({ size: "lg" }), "mt-6 inline-flex h-10 px-4")}>
          Set up
        </Link>
      </main>
    );
  }

  const house = household;
  const parent = firstName(house.parentName);
  const recent = log.slice(0, 7);

  function togglePause() {
    writeHousehold({ ...house, paused: !house.paused });
  }

  function markReached() {
    if (!last || last.outcome !== "missed") return;
    const updated: CallRecord = {
      ...last,
      outcome: "ok",
      flags: ["well"],
      summaryEn: `${house.parentName}: reached after a missed call — was at puja / busy. Neighbour stood down.`,
      summaryHi: `${house.parentName}: बाद में बात हुई — पूजा / व्यस्त थीं। पड़ोस को रोका गया।`,
    };
    writeCall(updated);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {household.city} · {household.language} · {household.callTime}
          </p>
          <h1 className="mt-1 font-heading text-3xl tracking-tight">
            {household.relation} {parent}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Briefings go to {household.childName} · {household.childWhatsapp}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/call"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-10 px-4",
              household.paused && "pointer-events-none opacity-50",
            )}
          >
            Call now
          </Link>
          <Button variant="outline" className="h-10 px-4" onClick={togglePause}>
            {household.paused ? "Resume calling" : "Pause calling"}
          </Button>
        </div>
      </div>

      {household.paused ? (
        <p className="mt-6 rounded-lg border border-border bg-muted px-3 py-2 text-sm">
          Calling is paused. {parent} will not be rung until you resume. Honour a
          parent who said stop.
        </p>
      ) : null}

      <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-7">
        {recent.length === 0
          ? Array.from({ length: 7 }, (_, index) => (
              <div key={index} className="rounded-lg border border-border bg-card px-2 py-3 text-center">
                <p className="text-[11px] text-muted-foreground">Day</p>
                <p className="mt-2 text-xs font-medium">—</p>
              </div>
            ))
          : recent.map((item) => (
              <div key={item.endedAt} className="rounded-lg border border-border bg-card px-2 py-3 text-center">
                <p className="text-[11px] text-muted-foreground">{item.endedAt.slice(0, 10)}</p>
                <p className="mt-2 text-xs font-medium">{OUTCOME_LABEL[item.outcome]}</p>
              </div>
            ))}
      </div>

      {!last ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>No call yet</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 text-muted-foreground">
            Next window {household.callTime}. The desk stays blank until someone
            answers — or does not. Trigger a test call now; do not wait for morning.
          </CardContent>
        </Card>
      ) : (
        <section className="mt-8 space-y-4">
          <WhatsAppCard
            to={household.childName}
            phone={household.childWhatsapp}
            outcome={last.outcome}
            body={last.summaryEn}
            bodyHi={last.summaryHi}
          />
          {last.outcome === "emergency" || last.outcome === "missed" ? (
            <WhatsAppCard
              to={household.neighborName}
              phone={household.neighborPhone}
              outcome={last.outcome}
              body={
                last.outcome === "missed"
                  ? `Please knock on ${household.parentName}’s door. Two calls, no answer. Call ${household.childName} when you are there.`
                  : `${household.parentName} reported a fall / distress on the morning call. Please go over. ${household.childName} has been told.`
              }
            />
          ) : null}
          {last.outcome === "watch" && last.flags.includes("meds_skipped") ? (
            <p className="text-sm text-muted-foreground">
              Afternoon callback is queued: confirm the tablet was taken.
            </p>
          ) : null}
          {last.outcome === "missed" ? (
            <Button variant="outline" onClick={markReached}>
              Neighbour reached them — they were fine
            </Button>
          ) : null}
        </section>
      )}

      <dl className="mt-10 grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Their number</dt>
          <dd className="mt-1">{household.parentPhone}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Tablets</dt>
          <dd className="mt-1">{household.medicines}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Neighbour</dt>
          <dd className="mt-1">
            {household.neighborName} · {household.neighborPhone}
          </dd>
        </div>
      </dl>

      <p className="mt-8 text-sm">
        <Link href="/onboard" className="text-muted-foreground hover:text-foreground">
          Edit household
        </Link>
      </p>
    </main>
  );
}

function WhatsAppCard({
  to,
  phone,
  outcome,
  body,
  bodyHi,
}: {
  to: string;
  phone: string;
  outcome: CallOutcome;
  body: string;
  bodyHi?: string;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>WhatsApp to {to}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{phone}</p>
          </div>
          <span className={cn("rounded-md px-2 py-1 text-xs font-medium", outcomeClass(outcome))}>
            {OUTCOME_LABEL[outcome]}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pb-4 pt-3 leading-6">
        <p>{body}</p>
        {bodyHi ? <p className="font-devanagari text-muted-foreground">{bodyHi}</p> : null}
      </CardContent>
    </Card>
  );
}
