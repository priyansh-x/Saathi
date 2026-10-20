import type { Metadata } from "next";
import { connection } from "next/server";
import { titled } from "@/lib/page-title";
import { BackLink, ExpiredLink } from "@/components/family/chrome";
import { FamilyShell } from "@/components/family/family-shell";
import { callById, dosesOnDay, openActAlerts, parentByToken } from "@/lib/db/queries";
import { readLang } from "@/lib/family-load";
import { callBullets, callLanguageLabel, callTranscriptLines, qs } from "@/lib/history";
import { messages } from "@/lib/i18n/messages";
import { formatCallHeader, toIsoString } from "@/lib/time";
import { doseMark, slotLabel } from "@/lib/today";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  return titled("Call · Saathi", "कॉल · साथी", (await searchParams).lang);
}

export default async function CallDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string; id: string }>;
  searchParams: Promise<{ lang?: string; from?: string; days?: string }>;
}) {
  await connection();
  const { token, id } = await params;
  const sp = await searchParams;
  const lang = readLang(sp.lang);
  const t = messages[lang];
  const extraQuery = { from: sp.from, days: sp.days };
  const backHref =
    sp.from === "today" ? `/d/${token}${qs({ lang })}` : `/d/${token}/history${qs({ lang, days: sp.days })}`;
  const backLabel = sp.from === "today" ? t.backToday : t.backHistory;

  try {
    const parent = await parentByToken(token);
    if (!parent) return <ExpiredLink lang={lang} />;
    const callId = decodeURIComponent(id);
    const [call, actAlerts] = await Promise.all([callById(callId), openActAlerts(parent.id)]);

    if (!call || call.parent_id !== parent.id) {
      return (
        <FamilyShell token={token} lang={lang} example={parent.is_example} alerts={actAlerts} active="history" extraQuery={extraQuery} addressTerm={parent.address_term}>
          <BackLink href={backHref}>{backLabel}</BackLink>
          <p className="mt-4">{t.emptyCall}</p>
        </FamilyShell>
      );
    }

    const started = toIsoString(call.started_at);
    const day = started.slice(0, 10);
    let doses: Awaited<ReturnType<typeof dosesOnDay>> = [];
    try {
      doses = day ? await dosesOnDay(parent.id, day) : [];
    } catch {
      doses = [];
    }
    const lines = callTranscriptLines(call.transcript_json);
    const spoken = call.mood_quote_lang || parent.languages.split(",")[0];
    const bullets = callBullets(lang === "hi" ? call.summary_hi : call.summary_en);

    return (
      <FamilyShell
        token={token}
        lang={lang}
        example={Boolean(parent.is_example)}
        alerts={actAlerts}
        active="history"
        extraQuery={extraQuery}
        updatedAt={toIsoString(call.ended_at || call.started_at) || null}
        addressTerm={parent.address_term}
      >
        <BackLink href={backHref}>{backLabel}</BackLink>
        <p className="mt-3 tabular text-sm text-muted-foreground">
          {formatCallHeader(started, Number(call.duration_sec) || null, callLanguageLabel(lang, spoken), lang)}
          {call.total_cost != null ? ` · ${t.callUsage.replace("{cost}", String(call.total_cost))}` : ""}
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
          <section className="card mt-5 px-4 py-3">
            <p className="text-sm text-muted-foreground">{t.medicinesToday}</p>
            <ul className="mt-2 space-y-2">
              {doses.map((dose) => (
                <li key={String(dose.medicine_id || dose.id)} className="flex items-baseline justify-between gap-3">
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
          <section className="card mt-5 px-4 py-3">
            <p className="text-sm text-muted-foreground">{t.inHerWords}</p>
            <p className="font-devanagari mt-1 text-lg leading-[1.6]">“{String(call.mood_quote)}”</p>
          </section>
        ) : null}

        <details className="card mt-5 px-4 py-3" open={lines.length > 0}>
          <summary className="cursor-pointer min-h-11">{t.showConversation}</summary>
          {lines.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{t.waitingTranscript}</p>
          ) : (
            <ol className="mt-3 space-y-2 text-sm">
              {lines.map((line, i) => (
                <li key={i}>
                  <p className="font-devanagari">{String(line.hi || line.en || "")}</p>
                  {line.en && line.en !== line.hi ? <p className="text-muted-foreground">{String(line.en)}</p> : null}
                </li>
              ))}
            </ol>
          )}
        </details>
        <p className="mt-4 text-sm text-muted-foreground">
          {parent.recording_consent ? t.audioConsentOn : t.audioConsentOff}
        </p>
      </FamilyShell>
    );
  } catch {
    return (
      <FamilyShell token={token} lang={lang} example={false} alerts={[]} active="history" extraQuery={extraQuery}>
        <BackLink href={backHref}>{backLabel}</BackLink>
        <p className="mt-4">{t.emptyCall}</p>
      </FamilyShell>
    );
  }
}
