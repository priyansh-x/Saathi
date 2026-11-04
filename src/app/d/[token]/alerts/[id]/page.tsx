import type { Metadata } from "next";
import { DetailShell, ExpiredLink } from "@/components/family/chrome";
import { titled } from "@/lib/page-title";
import { qs } from "@/lib/history";
import { ackAlert } from "@/lib/whatsapp/ack";
import { alertById, alertEvents, contactsFor, parentByToken, resolveAlert } from "@/lib/db/queries";
import { alertLife, alertQuoteLine, alertTitle, eventLine, statusPill } from "@/lib/alerts";
import { readLang } from "@/lib/family-load";
import { messages } from "@/lib/i18n/messages";
import { formatFriendlyTime } from "@/lib/time";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const PILL_TONE = {
  neutral: "bg-sunk text-muted-foreground",
  good: "bg-good-soft text-good",
  look: "bg-amber-soft text-amber-ink",
  open: "bg-alert-soft text-alert",
} as const;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  return titled("Alert · Saathi", "अलर्ट · साथी", (await searchParams).lang);
}


export default async function AlertDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string; id: string }>;
  searchParams: Promise<{ lang?: string; from?: string }>;
}) {
  const { token, id } = await params;
  const sp = await searchParams;
  const lang = readLang(sp.lang);
  const from = sp.from;
  const t = messages[lang];
  const backHref = from === "today" ? `/d/${token}${qs({ lang })}` : `/d/${token}/alerts${qs({ lang })}`;
  const backLabel = from === "today" ? t.backToday : t.backAlertsShort;

  const parent = await parentByToken(token);
  if (!parent) {
    return <ExpiredLink lang={lang} />;
  }
  const contacts = await contactsFor(parent.id);
  const child = contacts.find((row) => row.role === "child") ?? null;
  const neighbour = contacts.find((row) => row.role === "neighbour") ?? null;
  const alert = await alertById(id);
  if (!alert || alert.parent_id !== parent.id) {
    return (
      <DetailShell back={{ href: backHref, label: backLabel }}>
        <p className="mt-4 text-[19px] font-semibold">{t.emptyAlerts}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t.emptyAlertsBody}</p>
      </DetailShell>
    );
  }
  const events = await alertEvents(id);
  const actor = child?.first_name || child?.full_name || "family";
  const life = alertLife({ ...alert, is_false: events.some((e) => e.kind === "false_alarm") });
  const pill = statusPill({ ...alert, is_false: life === "false" }, lang);
  const quote = alertQuoteLine(alert);
  const told = [child?.full_name, neighbour?.full_name].filter(Boolean).join(" · ");

  async function markGoing() {
    "use server";
    await ackAlert(id, actor);
    redirect(`/d/${token}/alerts/${id}?lang=${lang}`);
  }

  async function markOk() {
    "use server";
    await resolveAlert(id, actor, "resolved");
    redirect(`/d/${token}/alerts/${id}?lang=${lang}`);
  }

  async function markFalse() {
    "use server";
    await resolveAlert(id, actor, "false_alarm");
    redirect(`/d/${token}/alerts/${id}?lang=${lang}`);
  }

  return (
    <DetailShell back={{ href: backHref, label: backLabel }}>
      <span className={`pill mt-2 ${PILL_TONE[pill.tone]}`}>{pill.label}</span>
      <h1 className="mt-3 text-[26px] leading-tight font-semibold tracking-tight first-letter:uppercase">
        {alertTitle(alert, lang)}
      </h1>
      <p className="mt-1 tabular text-sm text-muted-foreground">{formatFriendlyTime(alert.created_at, lang)}</p>
      {quote ? (
        <blockquote className="card font-devanagari mt-5 px-4 py-3 text-lg leading-[1.6]">“{quote}”</blockquote>
      ) : null}

      <section className="card mt-4 px-4 py-3">
        <p className="text-sm text-muted-foreground">{t.whoWeTold}</p>
        <p className="mt-1">
          {told || "-"} · {t.channelWhatsapp}
        </p>
      </section>

      {events.length > 0 ? (
        <ol className="list-group mt-4">
          {events.map((event) => (
            <li key={event.id} className="list-row text-[15px] leading-snug">
              {eventLine(event, lang)}
            </li>
          ))}
        </ol>
      ) : null}

      {life === "open" ? (
        <form action={markGoing} className="mt-6">
          <button type="submit" className="btn-primary">
            {t.imOnIt}
          </button>
        </form>
      ) : null}

      {life === "open" || life === "going" ? (
        <div className="mt-3 space-y-2">
          <form action={markOk}>
            <button type="submit" className="btn-secondary">
              {t.shesOk}
            </button>
          </form>
          <form action={markFalse}>
            <button type="submit" className="inline-flex h-11 w-full items-center justify-center text-sm text-muted-foreground underline-offset-2 hover:underline">
              {t.falseAlarm}
            </button>
          </form>
        </div>
      ) : null}
    </DetailShell>
  );
}
