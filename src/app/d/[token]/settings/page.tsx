import { redirect } from "next/navigation";
import { FamilyFrame } from "@/components/family/chrome";
import { setPaused } from "@/lib/db/queries";
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
  const t = messages[lang];
  const parentId = data.parent.id;
  const nextPaused = !data.parent.paused;

  async function togglePause() {
    "use server";
    await setPaused(parentId, nextPaused);
    redirect(`/d/${token}/settings?lang=${lang}`);
  }

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
    </FamilyFrame>
  );
}
