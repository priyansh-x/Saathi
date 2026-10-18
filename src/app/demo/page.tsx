import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MorningLines } from "@/components/demo/morning-lines";
import { PhonePreview } from "@/components/demo/phone-preview";
import { RecordPlayer } from "@/components/demo/record-player";
import { ExamplePill } from "@/components/family/chrome";
import { runMockScenario } from "@/lib/bolna/mock-run";
import { EXAMPLE_TOKEN, isMockBolna } from "@/lib/config";
import { resolveAlert } from "@/lib/db/queries";
import { demoModeAllowed, playDemoGoodMorning, resetDemoHousehold } from "@/lib/demo-mode";
import { buildRecordScenes } from "@/lib/demo-record";
import { WALK_COPY, exampleWhatsappPreviews } from "@/lib/demo-walk";
import { loadFamily, readLang } from "@/lib/family-load";
import { advanceLadder } from "@/lib/ladder";
import { ackAlert } from "@/lib/whatsapp/ack";

export const metadata: Metadata = {
  title: "Demo · EXAMPLE · Saathi",
};

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; step?: string; record?: string }>;
}) {
  if (!demoModeAllowed() || !isMockBolna()) notFound();
  const q = await searchParams;
  const lang = readLang(q.lang);
  const step = q.step || "start";
  if (q.record === "1") {
    return <RecordPlayer lang={lang} scenes={buildRecordScenes(lang)} />;
  }
  const t = WALK_COPY[lang];
  const data = await loadFamily(EXAMPLE_TOKEN);
  const parentId = data?.parent.id ?? "parent_kamla";
  const neighbour = data?.neighbour?.first_name || "Sunita";
  const child = data?.child?.first_name || "Rohit";
  const openAlertId = data?.actAlerts[0]?.id ?? "";
  const callId = data?.call?.id ?? "";
  const previews = exampleWhatsappPreviews();

  async function reset() {
    "use server";
    await resetDemoHousehold();
    redirect(`/demo?lang=${lang}&step=start`);
  }

  async function nextCall() {
    "use server";
    await playDemoGoodMorning();
    redirect(`/demo?lang=${lang}&step=call`);
  }

  async function nextMeds() {
    "use server";
    redirect(`/demo?lang=${lang}&step=meds`);
  }

  async function nextBrief() {
    "use server";
    redirect(`/demo?lang=${lang}&step=brief`);
  }

  async function nextMissed() {
    "use server";
    await runMockScenario("missed", parentId);
    redirect(`/demo?lang=${lang}&step=missed`);
  }

  async function nextLadder() {
    "use server";
    if (callId) await advanceLadder({ parentId, callId, elapsedMin: 60 });
    redirect(`/demo?lang=${lang}&step=ladder`);
  }

  async function nextGoing() {
    "use server";
    if (openAlertId) await ackAlert(openAlertId, neighbour);
    redirect(`/demo?lang=${lang}&step=going`);
  }

  async function nextOk() {
    "use server";
    if (openAlertId) await resolveAlert(openAlertId, child, "resolved");
    redirect(`/demo?lang=${lang}&step=ok`);
  }

  return (
    <main className="mx-auto max-w-[480px] px-4 py-8 pb-16">
      <p className="flex items-center gap-2 text-sm font-medium">
        <ExamplePill lang={lang} />
        One EXAMPLE morning
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        About 90 seconds. Next walks a simulated call — Hindi with English below. Nothing dials.
      </p>
      <form action={reset} className="mt-4">
        <button type="submit" className="btn-secondary">
          {t.reset}
        </button>
      </form>

      {step === "start" ? (
        <form action={nextCall} className="mt-8">
          <button type="submit" className="btn-primary">
            Next · the call
          </button>
        </form>
      ) : null}

      {step === "call" ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">The call (EXAMPLE)</h2>
          <MorningLines />
          <form action={nextMeds} className="mt-6">
            <button type="submit" className="btn-primary">
              Next · medicines
            </button>
          </form>
        </section>
      ) : null}

      {step === "meds" ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Medicines (EXAMPLE)</h2>
          <p className="mt-2">Amlodipine — taken. Metformin — afternoon, not asked yet.</p>
          <form action={nextBrief} className="mt-6">
            <button type="submit" className="btn-primary">
              Next · briefing
            </button>
          </form>
        </section>
      ) : null}

      {step === "brief" ? (
        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold">Summary and WhatsApp (EXAMPLE)</h2>
          <p className="text-sm text-muted-foreground">{data?.call?.summary_en || "Kamla slept well and took Amlodipine."}</p>
          <PhonePreview title={`${t.child} · EN`} body={previews.missed_soft_en.replace("Needs a look", "Good morning").replace("No answer yet.", "Neend theek thi.")} />
          <form action={nextMissed} className="mt-6">
            <button type="submit" className="btn-secondary">
              Optional · missed call
            </button>
          </form>
          <Link href={`/d/${EXAMPLE_TOKEN}?lang=${lang}`} className="btn-primary mt-3">
            {t.openToday}
          </Link>
        </section>
      ) : null}

      {step === "missed" ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">{t.missedTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t.missedHint}</p>
          <form action={nextLadder} className="mt-6">
            <button type="submit" className="btn-primary">
              Next · the ladder
            </button>
          </form>
        </section>
      ) : null}

      {step === "ladder" ? (
        <section className="mt-8 space-y-3">
          <PhonePreview title={`${t.neighbour} · EXAMPLE`} body={previews.neighbour_missed_en} />
          <form action={nextGoing} className="mt-6">
            <button type="submit" className="btn-primary">
              {t.redNeighbour}
            </button>
          </form>
        </section>
      ) : null}

      {step === "going" ? (
        <section className="mt-8">
          <p>{t.doneNeighbour}</p>
          <form action={nextOk} className="mt-6">
            <button type="submit" className="btn-primary">
              {t.redOk}
            </button>
          </form>
        </section>
      ) : null}

      {step === "ok" ? (
        <section className="mt-8">
          <p>{t.doneOk}</p>
          <Link href={`/d/${EXAMPLE_TOKEN}?lang=${lang}`} className="btn-primary mt-6">
            {t.openToday}
          </Link>
        </section>
      ) : null}

      <p className="mt-10 text-sm">
        <Link href={`/demo/controls?lang=${lang}`} className="text-primary underline-offset-2 hover:underline">
          {t.title}
        </Link>
      </p>
    </main>
  );
}
