import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MorningLines } from "@/components/demo/morning-lines";
import { PhonePreview } from "@/components/demo/phone-preview";
import { RecordPlayer } from "@/components/demo/record-player";
import { BrandMark } from "@/components/brand";
import { ExamplePill } from "@/components/family/chrome";
import { runMockScenario } from "@/lib/bolna/mock-run";
import { EXAMPLE_TOKEN, demoAudioUrl } from "@/lib/config";
import { resolveAlert } from "@/lib/db/queries";
import { demoModeAllowed, playDemoGoodMorning, resetDemoHousehold } from "@/lib/demo-mode";
import { buildRecordScenes } from "@/lib/demo-record";
import { WALK_COPY, exampleWhatsappPreviews } from "@/lib/demo-walk";
import { loadFamily, readLang } from "@/lib/family-load";
import { advanceLadder } from "@/lib/ladder";
import { titled } from "@/lib/page-title";
import { ackAlert } from "@/lib/whatsapp/ack";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  return titled("Demo · EXAMPLE · Saathi", "डेमो · EXAMPLE · साथी", (await searchParams).lang);
}

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; step?: string; record?: string }>;
}) {
  if (!demoModeAllowed()) notFound();
  const q = await searchParams;
  const lang = readLang(q.lang);
  const step = q.step || "start";
  const audioUrl = demoAudioUrl();
  if (q.record === "1") {
    return <RecordPlayer lang={lang} scenes={buildRecordScenes(lang)} audioUrl={audioUrl} />;
  }
  const t = WALK_COPY[lang];
  const data = await loadFamily(EXAMPLE_TOKEN);
  const parentId = data?.parent.id ?? "parent_kamla";
  const neighbour = data?.neighbour?.first_name || "Sunita";
  const child = data?.child?.first_name || "Rohit";
  const openAlertId = data?.actAlerts[0]?.id ?? "";
  const callId = data?.call?.id ?? "";
  const previews = exampleWhatsappPreviews();
  const other = lang === "hi" ? "en" : "hi";

  async function reset() {
    "use server";
    if (!demoModeAllowed()) notFound();
    await resetDemoHousehold();
    redirect(`/demo?lang=${lang}&step=start`);
  }

  async function nextCall() {
    "use server";
    if (!demoModeAllowed()) notFound();
    await playDemoGoodMorning();
    redirect(`/demo?lang=${lang}&step=call`);
  }

  async function nextMeds() {
    "use server";
    if (!demoModeAllowed()) notFound();
    redirect(`/demo?lang=${lang}&step=meds`);
  }

  async function nextBrief() {
    "use server";
    if (!demoModeAllowed()) notFound();
    redirect(`/demo?lang=${lang}&step=brief`);
  }

  async function nextMissed() {
    "use server";
    if (!demoModeAllowed()) notFound();
    await runMockScenario("missed", parentId);
    redirect(`/demo?lang=${lang}&step=missed`);
  }

  async function nextRed() {
    "use server";
    if (!demoModeAllowed()) notFound();
    await runMockScenario("chest", parentId);
    redirect(`/demo?lang=${lang}&step=red`);
  }

  async function nextLadder() {
    "use server";
    if (!demoModeAllowed()) notFound();
    if (callId) await advanceLadder({ parentId, callId, elapsedMin: 60, redial: false });
    redirect(`/demo?lang=${lang}&step=ladder`);
  }

  async function nextGoing() {
    "use server";
    if (!demoModeAllowed()) notFound();
    if (openAlertId) await ackAlert(openAlertId, neighbour);
    redirect(`/demo?lang=${lang}&step=going`);
  }

  async function nextOk() {
    "use server";
    if (!demoModeAllowed()) notFound();
    if (openAlertId) await resolveAlert(openAlertId, child, "resolved");
    redirect(`/demo?lang=${lang}&step=ok`);
  }

  return (
    <main className="mx-auto w-full min-w-0 max-w-[480px] overflow-x-clip px-4 py-8 pb-16">
      <BrandMark />
      <p className="mt-6 flex items-center gap-2 text-sm font-medium">
        <ExamplePill lang={lang} />
        {t.oneMorning}
        <Link href={`/demo?lang=${other}&step=${step}`} className="ml-auto text-primary">
          {lang === "en" ? "हिं" : "EN"}
        </Link>
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{t.paceHint}</p>
      <p className="mt-2 text-sm">
        <Link href={`/demo?lang=${lang}&record=1`} className="underline-offset-2 hover:underline">
          {t.film}
        </Link>
      </p>
      <form action={reset} className="mt-4">
        <button type="submit" className="btn-secondary">
          {t.reset}
        </button>
      </form>

      {step === "start" ? (
        <form action={nextCall} className="mt-8">
          <button type="submit" className="btn-primary">
            {t.nextCall}
          </button>
        </form>
      ) : null}

      {step === "call" ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">{t.callTitle}</h2>
          <MorningLines audioUrl={audioUrl} />
          <form action={nextMeds} className="mt-6">
            <button type="submit" className="btn-primary">
              {t.nextMeds}
            </button>
          </form>
        </section>
      ) : null}

      {step === "meds" ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">{t.medsTitle}</h2>
          <p className="mt-2">{t.medsBody}</p>
          <form action={nextBrief} className="mt-6">
            <button type="submit" className="btn-primary">
              {t.nextBrief}
            </button>
          </form>
        </section>
      ) : null}

      {step === "brief" ? (
        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold">{t.briefTitle}</h2>
          <p className="text-sm text-muted-foreground">{data?.call?.summary_en || "Kamla slept well and took Amlodipine."}</p>
          <PhonePreview
            title={`${t.child} · EN`}
            body={previews.missed_soft_en.replace("Needs a look", "Good morning").replace("No answer yet.", "Neend theek thi.")}
          />
          <form action={nextMissed} className="mt-6">
            <button type="submit" className="btn-secondary">
              {t.optionalMissed}
            </button>
          </form>
          <form action={nextRed} className="mt-3">
            <button type="submit" className="btn-secondary">
              {t.optionalRed}
            </button>
          </form>
          <Link href={`/d/${EXAMPLE_TOKEN}?lang=${lang}`} className="btn-primary mt-3">
            {t.openToday}
          </Link>
        </section>
      ) : null}

      {step === "red" ? (
        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold">{t.redTitle}</h2>
          <p className="text-sm text-muted-foreground">{t.redHint}</p>
          <PhonePreview title={`${t.child} · EN`} body={previews.safety_en} />
          <PhonePreview title={`${t.neighbour} · हिं`} body={previews.responder_hi} />
          <form action={nextGoing} className="mt-6">
            <button type="submit" className="btn-primary">
              {t.redNeighbour}
            </button>
          </form>
        </section>
      ) : null}

      {step === "missed" ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">{t.missedTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t.missedHint}</p>
          <form action={nextLadder} className="mt-6">
            <button type="submit" className="btn-primary">
              {t.nextLadder}
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
    </main>
  );
}
