import { Suspense } from "react";
import { BackLink, ExpiredLink, FamilyFrame, LoadingState } from "@/components/family/chrome";
import { callById, dosesOnDay } from "@/lib/db/queries";
import { loadFamily, readLang } from "@/lib/family-load";
import { callBullets, callLanguageLabel, qs } from "@/lib/history";
import { messages } from "@/lib/i18n/messages";
import { formatCallHeader } from "@/lib/time";
import { doseMark, slotLabel } from "@/lib/today";

export default async function CallDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string; id: string }>;
  searchParams: Promise<{ lang?: string; from?: string; days?: string }>;
}) {
  const { token, id } = await params;
  const sp = await searchParams;
  const lang = readLang(sp.lang);
  return (
    <Suspense fallback={<LoadingState lang={lang} />}>
      <CallBody token={token} id={id} lang={lang} from={sp.from} days={sp.days} />
    </Suspense>
  );
}

async function CallBody({
  token,
  id,
  lang,
  from,
  days,
}: {
  token: string;
  id: string;
  lang: ReturnType<typeof readLang>;
  from?: string;
  days?: string;
}) {
  const data = await loadFamily(token);
  if (!data) return <ExpiredLink />;
  const call = await callById(id);
  const t = messages[lang];
  const extraQuery = { from, days };
  const backHref =
    from === "today"
      ? `/d/${token}${qs({ lang })}`
      : `/d/${token}/history${qs({ lang, days })}`;
  const backLabel = from === "today" ? t.backToday : t.backHistory;

  if (!call) {
    return (
      <FamilyFrame token={token} lang={lang} example={data.parent.is_example} alerts={data.actAlerts} active="history" extraQuery={extraQuery}>
        <BackLink href={backHref}>{backLabel}</BackLink>
        <p className="mt-4">{t.emptyCall}</p>
      </FamilyFrame>
    );
  }
  const day = call.started_at.slice(0, 10);
  const doses = await dosesOnDay(data.parent.id, day);
  const lines = call.transcript_json ? (JSON.parse(call.transcript_json) as { speaker: string; hi: string; en: string }[]) : [];
  const spoken = call.mood_quote_lang || data.parent.languages.split(",")[0];
  const bullets = callBullets(lang === "hi" ? call.summary_hi : call.summary_en);

  return (
    <FamilyFrame
      token={token}
      lang={lang}
      example={data.parent.is_example}
      alerts={data.actAlerts}
      active="history"
      extraQuery={extraQuery}
      updatedAt={call.ended_at || call.started_at}
    >
      <BackLink href={backHref}>{backLabel}</BackLink>
      <p className="mt-3 tabular text-sm text-muted-foreground">
        {formatCallHeader(call.started_at, call.duration_sec, callLanguageLabel(lang, spoken))}
      </p>

      <section className="mt-5">
        <h1 className="text-sm text-muted-foreground">{t.summary}</h1>
        {bullets.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {bullets.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2">{t.emptyCall}</p>
        )}
      </section>

      {doses.length > 0 ? (
        <section className="mt-5 rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">{t.medicinesToday}</p>
          <ul className="mt-2 space-y-2">
            {doses.map((dose) => (
              <li key={dose.medicine_id || dose.id} className="flex items-baseline justify-between gap-3">
                <span>
                  {dose.name} <span className="text-sm text-muted-foreground">{slotLabel(dose.meal, lang)}</span>
                </span>
                <span className="text-sm">{doseMark(dose.status, lang)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {call.mood_quote ? (
        <section className="mt-5 rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">{t.inHerWords}</p>
          <p className="font-devanagari mt-1 text-lg leading-[1.6]">“{call.mood_quote}”</p>
        </section>
      ) : null}

      <details className="mt-5 rounded-2xl border border-border bg-card px-4 py-3">
        <summary className="cursor-pointer min-h-11">{t.showConversation}</summary>
        {lines.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t.emptyCall}</p>
        ) : (
          <ol className="mt-3 space-y-2 text-sm">
            {lines.map((line, i) => (
              <li key={i}>
                <p className="font-devanagari">{line.hi}</p>
                <p className="text-muted-foreground">{line.en}</p>
              </li>
            ))}
          </ol>
        )}
      </details>

      <p className="mt-4 text-sm text-muted-foreground">
        {data.parent.recording_consent ? t.audioConsentOn : t.audioConsentOff}
      </p>
    </FamilyFrame>
  );
}
