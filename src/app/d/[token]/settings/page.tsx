import { redirect } from "next/navigation";
import { ExpiredLink, FamilyFrame } from "@/components/family/chrome";
import { runMockScenario, type MockScenario } from "@/lib/bolna/mock-run";
import { isMockBolna, isMockWhatsapp } from "@/lib/config";
import { setPaused } from "@/lib/db/queries";
import { ackAlert } from "@/lib/whatsapp/ack";
import { recentOutbound } from "@/lib/whatsapp/send";
import { loadFamily, readLang } from "@/lib/family-load";
import { messages } from "@/lib/i18n/messages";
import { formatIstTime } from "@/lib/time";

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { token } = await params;
  const lang = readLang((await searchParams).lang);
  const data = await loadFamily(token);
  if (!data) return <ExpiredLink />;
  const t = messages[lang];
  const parentId = data.parent.id;
  const nextPaused = !data.parent.paused;
  const actor = data.child?.first_name || "Rohit";
  const openAlertId = data.actAlerts[0]?.id ?? "";

  async function togglePause() {
    "use server";
    await setPaused(parentId, nextPaused);
    redirect(`/d/${token}/settings?lang=${lang}`);
  }

  async function runMock(formData: FormData) {
    "use server";
    const scenario = String(formData.get("scenario") || "good") as MockScenario;
    await runMockScenario(scenario, parentId);
    redirect(`/d/${token}?lang=${lang}`);
  }

  async function mockAck() {
    "use server";
    if (openAlertId) await ackAlert(openAlertId, actor);
    redirect(`/d/${token}/alerts/${openAlertId}?lang=${lang}`);
  }

  const outbound = await recentOutbound(parentId, 8);

  return (
    <FamilyFrame
      token={token}
      lang={lang}
      example={data.parent.is_example}
      alerts={data.actAlerts}
      active="settings"
    >
      <h1 className="text-2xl font-semibold">{data.parent.full_name}</h1>
      <dl className="mt-5 space-y-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Phone</dt>
          <dd className="mt-1">{data.parent.phone}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Languages</dt>
          <dd className="mt-1">{data.parent.languages}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Call window</dt>
          <dd className="tabular mt-1">{formatIstTime(data.parent.call_time)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Neighbour</dt>
          <dd className="mt-1">
            {data.neighbour?.full_name} ji · {data.neighbour?.phone}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{lang === "hi" ? "रोक" : "Pause"}</dt>
          <dd className="mt-1">{data.parent.paused ? t.paused : lang === "hi" ? "कॉल चालू हैं।" : "Calling is on."}</dd>
        </div>
      </dl>
      <form action={togglePause} className="mt-6">
        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border"
        >
          {data.parent.paused ? t.pauseOff : t.pauseOn}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">{t.settingsHint}</p>
      {isMockBolna() ? (
        <form action={runMock} className="mt-8 space-y-3">
          <p className="text-sm font-medium">{lang === "hi" ? "मॉक कॉल (उदाहरण)" : "Mock Bolna (EXAMPLE)"}</p>
          <p className="text-sm text-muted-foreground">
            {lang === "hi"
              ? "असली फ़ोन नहीं बजता। टूल और वेबहुक यहीं चलते हैं।"
              : "Does not dial. Runs tools and the webhook against this household."}
          </p>
          <button
            type="submit"
            name="scenario"
            value="good"
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border"
          >
            {lang === "hi" ? "अच्छी सुबह" : "Good morning"}
          </button>
          <button
            type="submit"
            name="scenario"
            value="chest"
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-white"
          >
            {lang === "hi" ? "सीने में दर्द" : "Chest-pain line"}
          </button>
          <button
            type="submit"
            name="scenario"
            value="late"
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border"
          >
            {lang === "hi" ? "देर से अलर्ट" : "Late extraction alert"}
          </button>
        </form>
      ) : null}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">{lang === "hi" ? "भेजे गए संदेश" : "Outbound (EXAMPLE)"}</h2>
        {outbound.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {lang === "hi" ? "अभी कोई संदेश नहीं।" : "No messages logged yet."}
          </p>
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
      {isMockWhatsapp() && data.actAlerts[0] ? (
        <form action={mockAck} className="mt-6">
          <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-white">
            {lang === "hi" ? "रोहित ने कहा — मैं जा रहा हूँ" : "Pretend Rohit tapped I'm on it"}
          </button>
        </form>
      ) : null}
    </FamilyFrame>
  );
}
