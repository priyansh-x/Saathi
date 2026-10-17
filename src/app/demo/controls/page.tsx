import { notFound, redirect } from "next/navigation";
import { ExamplePill } from "@/components/family/chrome";
import { resetToday, runMockScenario, type MockScenario } from "@/lib/bolna/mock-run";
import { EXAMPLE_TOKEN, isMockBolna, isMockWhatsapp, killSwitchOn } from "@/lib/config";
import { recordConsent } from "@/lib/consent";
import { resolveAlert } from "@/lib/db/queries";
import { WALK_COPY, exampleWhatsappPreviews } from "@/lib/demo-walk";
import { loadFamily, readLang } from "@/lib/family-load";
import { messages } from "@/lib/i18n/messages";
import { advanceLadder } from "@/lib/ladder";
import { ackAlert } from "@/lib/whatsapp/ack";
import { recentOutbound } from "@/lib/whatsapp/send";

function PhonePreview({ title, body }: { title: string; body: string }) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-border bg-[#111] p-1.5">
      <div className="overflow-hidden rounded-[22px] bg-[#efe7dc]">
        <p className="bg-[#075e54] px-3 py-2 text-[12px] font-medium text-white">{title} · EXAMPLE</p>
        <div className="p-3">
          <p className="rounded-[14px] rounded-tl-[4px] bg-white px-3 py-2 text-sm whitespace-pre-wrap">{body}</p>
        </div>
      </div>
    </article>
  );
}

export default async function DemoControlsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; walk?: string; step?: string }>;
}) {
  if (!isMockBolna() && !isMockWhatsapp()) notFound();
  const q = await searchParams;
  const lang = readLang(q.lang);
  const t = WALK_COPY[lang];
  const ui = messages[lang];
  const data = await loadFamily(EXAMPLE_TOKEN);
  if (!data) notFound();
  const parentId = data.parent.id;
  const callId = data.call?.id ?? "";
  const neighbour = data.neighbour?.first_name || data.neighbour?.full_name || "Sunita";
  const child = data.child?.first_name || data.child?.full_name || "family";
  const openAlertId = data.actAlerts[0]?.id ?? "";
  const outbound = await recentOutbound(parentId, 8);
  const previews = exampleWhatsappPreviews();
  const desk = `/d/${EXAMPLE_TOKEN}?lang=${lang}`;
  const walk = q.walk ?? "";
  const step = q.step ?? "";

  async function reset() {
    "use server";
    await resetToday(parentId);
    redirect(`/demo/controls?lang=${lang}`);
  }

  async function playChest() {
    "use server";
    await runMockScenario("chest", parentId);
    redirect(`/demo/controls?lang=${lang}&walk=red&step=played`);
  }

  async function neighbourGoing() {
    "use server";
    if (openAlertId) await ackAlert(openAlertId, neighbour);
    redirect(`/demo/controls?lang=${lang}&walk=red&step=going`);
  }

  async function maaOk() {
    "use server";
    if (openAlertId) await resolveAlert(openAlertId, child, "resolved");
    redirect(`/demo/controls?lang=${lang}&walk=red&step=ok`);
  }

  async function startMissed() {
    "use server";
    await runMockScenario("missed", parentId);
    redirect(`/demo/controls?lang=${lang}&walk=missed&step=start`);
  }

  async function jumpLadder(formData: FormData) {
    "use server";
    const elapsed = Number(formData.get("elapsed") || 30);
    if (callId) await advanceLadder({ parentId, callId, elapsedMin: elapsed });
    redirect(`/demo/controls?lang=${lang}&walk=missed&step=${elapsed}`);
  }

  async function runMock(formData: FormData) {
    "use server";
    const scenario = String(formData.get("scenario") || "good") as MockScenario;
    await runMockScenario(scenario, parentId);
    redirect(`/d/${EXAMPLE_TOKEN}?lang=${lang}`);
  }

  async function mockAck() {
    "use server";
    if (openAlertId) await ackAlert(openAlertId, child);
    redirect(`/d/${EXAMPLE_TOKEN}/alerts/${openAlertId}?lang=${lang}`);
  }

  async function recordHaan() {
    "use server";
    await recordConsent(parentId, "parent_voice", `haan, recorded in web view`);
    redirect(`/demo/controls?lang=${lang}`);
  }

  return (
    <main className="mx-auto max-w-[480px] px-4 py-8 pb-16">
      <p className="flex items-center gap-2 text-sm font-medium">
        <ExamplePill lang={lang} />
        {t.title}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{t.hint}</p>
      {killSwitchOn() ? <p className="mt-4 rounded-2xl bg-alert-soft px-4 py-3 text-alert">{ui.killSwitchOn}</p> : null}
      <p className="mt-3 text-sm">
        <a className="underline" href={desk}>
          {t.openToday}
        </a>
        {" · "}
        <a className="underline" href={`/d/${EXAMPLE_TOKEN}/alerts?lang=${lang}`}>
          {t.openAlerts}
        </a>
        {" · "}
        <a className="underline" href={`/d/${EXAMPLE_TOKEN}/history?lang=${lang}`}>
          {t.openHistory}
        </a>
      </p>
      <form action={reset} className="mt-6">
        <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border">
          {t.reset}
        </button>
      </form>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">{t.redTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.redHint}</p>
        <form action={playChest} className="mt-4">
          <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-white">
            {t.redPlay}
          </button>
        </form>
        {walk === "red" && step === "played" ? <p className="mt-3 text-sm">{t.doneRed}</p> : null}
        {walk === "red" && step === "going" ? <p className="mt-3 text-sm">{t.doneNeighbour}</p> : null}
        {walk === "red" && step === "ok" ? <p className="mt-3 text-sm">{t.doneOk}</p> : null}
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium">{t.preview}</p>
          <PhonePreview title={`${t.child} · EN`} body={previews.safety_en} />
          <PhonePreview title={`${t.child} · हिं`} body={previews.safety_hi} />
          <PhonePreview title={`${t.neighbour} · हिं`} body={previews.responder_hi} />
        </div>
        {isMockWhatsapp() && openAlertId ? (
          <form action={neighbourGoing} className="mt-4">
            <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border">
              {t.redNeighbour}
            </button>
          </form>
        ) : null}
        {walk === "red" && (step === "going" || step === "ok") ? (
          <div className="mt-4 space-y-3">
            <PhonePreview title={t.ack} body={previews.ack_en} />
            <PhonePreview title={`${t.ack} · हिं`} body={previews.ack_hi} />
          </div>
        ) : null}
        {isMockWhatsapp() && openAlertId && walk === "red" && step === "going" ? (
          <form action={maaOk} className="mt-4">
            <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-white">
              {t.redOk}
            </button>
          </form>
        ) : null}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">{t.missedTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.missedHint}</p>
        <form action={startMissed} className="mt-4">
          <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-white">
            {t.missedStart}
          </button>
        </form>
        <form action={jumpLadder} className="mt-3 space-y-3">
          <button type="submit" name="elapsed" value="30" className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border">
            {t.missedSoft}
          </button>
          <button type="submit" name="elapsed" value="45" className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border">
            {t.missedLast}
          </button>
          <button type="submit" name="elapsed" value="60" className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border">
            {t.missedEsc}
          </button>
        </form>
        {walk === "missed" && step === "60" ? <p className="mt-3 text-sm">{t.doneMissed}</p> : null}
        <div className="mt-4 space-y-3">
          <PhonePreview title={`${t.child} · ${t.preview}`} body={previews.missed_soft_en} />
          <PhonePreview title={`${t.neighbour} · ${t.preview}`} body={previews.neighbour_missed_en} />
        </div>
      </section>

      {isMockBolna() ? (
        <form action={runMock} className="mt-12 space-y-3">
          <p className="text-sm font-medium">{ui.mockBolna}</p>
          <p className="text-sm text-muted-foreground">{ui.mockBolnaHint}</p>
          {(
            [
              ["good", ui.mockGood],
              ["chest", ui.mockChest],
              ["late", ui.mockLate],
              ["missed", ui.mockMissed],
              ["skip", ui.mockSkip],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="submit"
              name="scenario"
              value={value}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border"
            >
              {label}
            </button>
          ))}
        </form>
      ) : null}

      <section className="mt-12">
        <h2 className="text-lg font-semibold">{t.outbound}</h2>
        {outbound.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t.outboundEmpty}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {outbound.map((row) => (
              <li key={row.id} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm">
                <p className="font-medium">
                  {row.channel} · {row.template} · {row.status}
                </p>
                <p className="mt-1 text-muted-foreground">{row.to_phone}</p>
                <p className="mt-2 whitespace-pre-wrap">{row.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={recordHaan} className="mt-8">
        <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border">
          {ui.recordHaan}
        </button>
      </form>
      <p className="mt-2 text-sm text-muted-foreground">{ui.consentNeed}</p>

      {isMockWhatsapp() && openAlertId ? (
        <form action={mockAck} className="mt-6">
          <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-white">
            {ui.pretendAck}
          </button>
        </form>
      ) : null}
    </main>
  );
}
