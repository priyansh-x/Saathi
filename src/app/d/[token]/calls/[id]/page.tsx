import type { Metadata } from "next";
import { DetailShell, ExpiredLink } from "@/components/family/chrome";
import { connection } from "next/server";
import { LiveRefresh } from "@/components/family/live-refresh";
import { deskLiveStamp, deskMedsStamp } from "@/lib/desk-live";
import { titled } from "@/lib/page-title";
import { callById, dosesOnDay, parentByToken } from "@/lib/db/queries";
import { readLang } from "@/lib/family-load";
import { callBullets, callLanguageLabel, callTranscriptLines, qs } from "@/lib/history";
import { messages, type Lang } from "@/lib/i18n/messages";
import { formatCallHeader, toIsoString } from "@/lib/time";
import { ringCopy, slotLabel } from "@/lib/today";
import { DosePill } from "@/components/family/today-panel";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  return titled("Call · Saathi", "कॉल · साथी", (await searchParams).lang);
}

function CallShell({
  token,
  stamp,
  back,
  children,
}: {
  token?: string;
  stamp?: string;
  back?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <DetailShell back={back} extra={token && stamp ? <LiveRefresh token={token} stamp={stamp} /> : null}>
      {children}
    </DetailShell>
  );
}

type CallParent = NonNullable<Awaited<ReturnType<typeof parentByToken>>>;
type CallRow = NonNullable<Awaited<ReturnType<typeof callById>>>;
type DoseRow = Awaited<ReturnType<typeof dosesOnDay>>[number];
type TranscriptLine = ReturnType<typeof callTranscriptLines>[number];

type CallDetail =
  | { kind: "expired" }
  | { kind: "empty" }
  | { kind: "waiting"; stamp: string }
  | {
      kind: "ok";
      parent: CallParent;
      call: CallRow;
      doses: DoseRow[];
      lines: TranscriptLine[];
      spoken: string;
      bullets: string[];
      cost: string;
      started: string;
    };

async function loadCallDetail(token: string, id: string, lang: Lang): Promise<CallDetail> {
  const parent = await parentByToken(token);
  if (!parent) return { kind: "expired" };

  let callId = id;
  try {
    callId = decodeURIComponent(id);
  } catch {
    callId = id;
  }
  const call = await callById(callId);
  if (!call || call.parent_id !== parent.id) {
    return { kind: "waiting", stamp: deskLiveStamp({ callId, status: "in_progress", hasWords: false }) };
  }

  const started = toIsoString(call.started_at);
  const day = started.slice(0, 10);
  let doses: DoseRow[] = [];
  try {
    doses = day ? await dosesOnDay(parent.id, day) : [];
  } catch {
    doses = [];
  }
  const lines = callTranscriptLines(call.transcript_json);
  const spoken = call.mood_quote_lang || String(parent.languages || "hi").split(",")[0];
  const bullets = callBullets(lang === "hi" ? call.summary_hi : call.summary_en);
  const cost = call.total_cost != null ? String(call.total_cost) : "";
  return { kind: "ok", parent, call, doses, lines, spoken, bullets, cost, started };
}

export default async function CallDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string; id: string }>;
  searchParams: Promise<{ lang?: string; from?: string; view?: string; call?: string }>;
}) {
  await connection();
  const { token, id } = await params;
  const sp = await searchParams;
  const lang = readLang(sp.lang);
  const t = messages[lang];
  const placedNote = ringCopy(sp.call, lang);
  const backHref =
    sp.from === "today" ? `/d/${token}${qs({ lang })}` : `/d/${token}/history${qs({ lang, view: sp.view === "list" ? "list" : undefined })}`;
  const backLabel = sp.from === "today" ? t.backToday : t.backHistory;
  const back = { href: backHref, label: backLabel };

  let loaded: Awaited<ReturnType<typeof loadCallDetail>>;
  try {
    loaded = await loadCallDetail(token, id, lang);
  } catch {
    loaded = { kind: "empty" };
  }

  if (loaded.kind === "expired") {
    return <ExpiredLink lang={lang} />;
  }

  if (loaded.kind === "empty") {
    return (
      <CallShell back={back}>
        <p className="mt-4">{t.emptyCall}</p>
      </CallShell>
    );
  }

  if (loaded.kind === "waiting") {
    return (
      <CallShell token={token} stamp={loaded.stamp} back={back}>
        {placedNote ? <p className="mt-4 text-sm text-muted-foreground">{placedNote}</p> : null}
        <p className="mt-4">{t.waitingTranscript}</p>
      </CallShell>
    );
  }

  const { parent, call, doses, lines, spoken, bullets, cost, started } = loaded;
  return (
    <CallShell
      token={token}
      stamp={deskLiveStamp({
        callId: call.id,
        status: call.status,
        endedAt: call.ended_at,
        hasWords: lines.length > 0,
        meds: deskMedsStamp(doses),
      })}
      back={back}
    >
      {placedNote && call.status === "in_progress" ? (
        <p className="mt-3 text-sm text-muted-foreground">{placedNote}</p>
      ) : null}
      <p className="mt-3 tabular text-sm text-muted-foreground">
        {formatCallHeader(started, Number(call.duration_sec) || null, callLanguageLabel(lang, spoken), lang)}
        {cost ? ` · ${t.callUsage.replace("{cost}", cost)}` : ""}
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
        <section className="mt-5">
          <p className="section-label">{t.medicinesToday}</p>
          <ul className="list-group mt-2">
            {doses.map((dose) => (
              <li key={String(dose.medicine_id || dose.id)} className="list-row">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-medium">{String(dose.name || "")}</span>
                  <span className="block text-[13px] text-ink-3">{slotLabel(String(dose.meal || ""), lang)}</span>
                </span>
                <span className="shrink-0">
                  <DosePill status={dose.status} lang={lang} />
                </span>
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
        <summary className="flex min-h-11 cursor-pointer items-center font-medium">{t.showConversation}</summary>
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
    </CallShell>
  );
}
