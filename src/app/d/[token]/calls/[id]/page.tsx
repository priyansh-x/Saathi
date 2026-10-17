import { FamilyFrame } from "@/components/family/chrome";
import { callById, dosesOnDay } from "@/lib/db/queries";
import { loadFamily, readLang } from "@/lib/family-load";
import { messages } from "@/lib/i18n/messages";
import { formatWhen } from "@/lib/time";

export default async function CallDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string; id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { token, id } = await params;
  const lang = readLang((await searchParams).lang);
  const data = await loadFamily(token);
  const call = await callById(id);
  const t = messages[lang];
  if (!call) {
    return (
      <FamilyFrame token={token} lang={lang} example={data.parent.is_example} alerts={data.actAlerts} active="history">
        <p>{t.loadError}</p>
      </FamilyFrame>
    );
  }
  const day = call.started_at.slice(0, 10);
  const doses = await dosesOnDay(data.parent.id, day);
  const lines = call.transcript_json ? (JSON.parse(call.transcript_json) as { speaker: string; hi: string; en: string }[]) : [];

  return (
    <FamilyFrame token={token} lang={lang} example={data.parent.is_example} alerts={data.actAlerts} active="history">
      <p className="tabular text-sm text-muted-foreground">{formatWhen(call.started_at)}</p>
      <h1 className="mt-2 text-2xl font-semibold">{lang === "hi" ? call.summary_hi : call.summary_en}</h1>
      <ul className="mt-5 space-y-2">
        {doses.map((dose) => (
          <li key={dose.medicine_id || dose.id} className="rounded-2xl border border-border bg-card px-4 py-3">
            {dose.name} · {dose.status === "taken" ? t.taken : dose.status === "not_taken" ? t.notTaken : dose.status === "not_sure" ? t.notSure : t.notAsked}
          </li>
        ))}
      </ul>
      <details className="mt-5 rounded-2xl border border-border bg-card px-4 py-3">
        <summary className="cursor-pointer">{t.transcript}</summary>
        <ol className="mt-3 space-y-2 text-sm">
          {lines.map((line, i) => (
            <li key={i}>
              <p className="font-devanagari">{line.hi}</p>
              <p className="text-muted-foreground">{line.en}</p>
            </li>
          ))}
        </ol>
      </details>
      {data.parent.recording_consent && call ? (
        <p className="mt-4 text-sm text-muted-foreground">{lang === "hi" ? "ऑडियो सहमति है, फ़ाइल नहीं जुड़ी।" : "Recording consent is on; no file attached in this example."}</p>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{lang === "hi" ? "ऑडियो नहीं — सहमति नहीं है।" : "No audio. She did not consent to recording."}</p>
      )}
    </FamilyFrame>
  );
}
