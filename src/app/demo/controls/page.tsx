import { notFound, redirect } from "next/navigation";
import { EXAMPLE_TOKEN, isMockBolna, isMockWhatsapp, killSwitchOn } from "@/lib/config";
import { runMockScenario, type MockScenario } from "@/lib/bolna/mock-run";
import { recordConsent } from "@/lib/consent";
import { ackAlert } from "@/lib/whatsapp/ack";
import { recentOutbound } from "@/lib/whatsapp/send";
import { loadFamily, readLang } from "@/lib/family-load";
import { messages } from "@/lib/i18n/messages";
import { ExamplePill } from "@/components/family/chrome";

export default async function DemoControlsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  if (!isMockBolna() && !isMockWhatsapp()) notFound();
  const lang = readLang((await searchParams).lang);
  const t = messages[lang];
  const data = await loadFamily(EXAMPLE_TOKEN);
  if (!data) notFound();
  const parentId = data.parent.id;
  const actor = data.child?.first_name || data.child?.full_name || "family";
  const openAlertId = data.actAlerts[0]?.id ?? "";
  const outbound = await recentOutbound(parentId, 8);

  async function runMock(formData: FormData) {
    "use server";
    const scenario = String(formData.get("scenario") || "good") as MockScenario;
    await runMockScenario(scenario, parentId);
    redirect(`/d/${EXAMPLE_TOKEN}?lang=${lang}`);
  }

  async function mockAck() {
    "use server";
    if (openAlertId) await ackAlert(openAlertId, actor);
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
        {t.demoTitle}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{t.demoHint}</p>
      {killSwitchOn() ? <p className="mt-4 rounded-2xl bg-alert-soft px-4 py-3 text-alert">{t.killSwitchOn}</p> : null}

      {isMockBolna() ? (
        <form action={runMock} className="mt-8 space-y-3">
          <p className="text-sm font-medium">{t.mockBolna}</p>
          <p className="text-sm text-muted-foreground">{t.mockBolnaHint}</p>
          {(
            [
              ["good", t.mockGood],
              ["chest", t.mockChest],
              ["late", t.mockLate],
              ["missed", t.mockMissed],
              ["skip", t.mockSkip],
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

      <section className="mt-10">
        <h2 className="text-lg font-semibold">{t.outboundTitle}</h2>
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
          {t.recordHaan}
        </button>
      </form>
      <p className="mt-2 text-sm text-muted-foreground">{t.consentNeed}</p>

      {isMockWhatsapp() && openAlertId ? (
        <form action={mockAck} className="mt-6">
          <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-white">
            {t.pretendAck}
          </button>
        </form>
      ) : null}
    </main>
  );
}
