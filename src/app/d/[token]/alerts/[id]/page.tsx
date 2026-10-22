import type { Metadata } from "next";
import Link from "next/link";
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

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  return titled("Alert · Saathi", "अलर्ट · साथी", (await searchParams).lang);
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="app-shell">
      <div className="app-shell-scroll px-4 pt-3 pb-8">{children}</div>
    </main>
  );
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
    return (
      <Shell>
        <h1 className="app-title mt-8">{t.linkExpired}</h1>
        <p className="mt-3 text-[16px] text-muted-foreground">{t.linkExpiredHint}</p>
        <Link href="/" className="btn-secondary mt-8">
          Saathi
        </Link>
      </Shell>
    );
  }
  const contacts = await contactsFor(parent.id);
  const child = contacts.find((row) => row.role === "child") ?? null;
  const neighbour = contacts.find((row) => row.role === "neighbour") ?? null;
  const alert = await alertById(id);
  if (!alert || alert.parent_id !== parent.id) {
    return (
      <Shell>
        <Link href={backHref} className="-ml-2 inline-flex h-11 items-center pr-3 text-[15px] font-medium text-primary">
          {backLabel}
        </Link>
        <p className="mt-4 text-[19px] font-semibold">{t.emptyAlerts}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t.emptyAlertsBody}</p>
        <Link href={backHref} className="btn-primary mt-6 inline-flex justify-center">
          {backLabel}
        </Link>
      </Shell>
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
    <Shell>
      <Link href={backHref} className="-ml-2 inline-flex h-11 items-center pr-3 text-[15px] font-medium text-primary">
        {backLabel}
      </Link>

      <p className="mt-4 text-sm text-muted-foreground">{pill.label}</p>
      <h1 className="mt-1 text-2xl font-semibold">{alertTitle(alert, lang)}</h1>
      {quote ? <p className="font-devanagari mt-2 text-lg leading-[1.6]">“{quote}”</p> : null}
      <p className="mt-1 text-sm text-muted-foreground">{formatFriendlyTime(alert.created_at, lang)}</p>

      <section className="card mt-5 px-4 py-3">
        <p className="text-sm text-muted-foreground">{t.whoWeTold}</p>
        <p className="mt-1">
          {told || "—"} · {t.channelWhatsapp}
        </p>
      </section>

      <ol className="mt-5 space-y-2">
        {events.map((event) => (
          <li key={event.id} className="rounded-2xl border border-border px-4 py-3 text-sm">
            {eventLine(event, lang)}
          </li>
        ))}
      </ol>

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
    </Shell>
  );
}
