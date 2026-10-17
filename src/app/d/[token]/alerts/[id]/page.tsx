import Link from "next/link";
import { Check } from "lucide-react";
import { ExpiredLink, FamilyFrame } from "@/components/family/chrome";
import { ackAlert } from "@/lib/whatsapp/ack";
import { alertById, alertEvents, resolveAlert } from "@/lib/db/queries";
import { alertLife, alertQuoteLine, alertTitle, eventLine, statusPill } from "@/lib/alerts";
import { loadFamily, readLang } from "@/lib/family-load";
import { messages } from "@/lib/i18n/messages";
import { formatFriendlyTime } from "@/lib/time";
import { redirect } from "next/navigation";

export default async function AlertDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string; id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { token, id } = await params;
  const lang = readLang((await searchParams).lang);
  const data = await loadFamily(token);
  if (!data) return <ExpiredLink />;
  const alert = await alertById(id);
  if (!alert) {
    return (
      <FamilyFrame token={token} lang={lang} example={data.parent.is_example} alerts={data.actAlerts} active="alerts">
        <p>{messages[lang].loadError}</p>
      </FamilyFrame>
    );
  }
  const events = await alertEvents(id);
  const t = messages[lang];
  const actor = data.child?.first_name || data.child?.full_name || "family";
  const life = alertLife({ ...alert, is_false: events.some((e) => e.kind === "false_alarm") });
  const pill = statusPill({ ...alert, is_false: life === "false" }, lang);
  const quote = alertQuoteLine(alert);
  const told = [data.child?.full_name, data.neighbour?.full_name].filter(Boolean).join(" · ");

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
    <FamilyFrame
      token={token}
      lang={lang}
      example={data.parent.is_example}
      alerts={data.actAlerts}
      active="alerts"
      updatedAt={alert.created_at}
    >
      <Link
        href={`/d/${token}/alerts?lang=${lang}`}
        className="inline-flex min-h-11 items-center text-sm font-medium"
      >
        {t.backAlerts}
      </Link>

      <ol className="mt-4 grid grid-cols-3 gap-2 text-xs">
        {[
          { key: "raised", label: t.stepRaised, on: true },
          { key: "going", label: t.stepGoing, on: life === "going" || life === "ok" || life === "false" },
          { key: "ok", label: t.stepOk, on: life === "ok" || life === "false" },
        ].map((step) => (
          <li
            key={step.key}
            className={`rounded-2xl px-2 py-3 text-center ${
              step.on ? (life === "ok" ? "bg-good-soft text-good" : "bg-amber-soft text-amber-ink") : "bg-secondary text-muted-foreground"
            }`}
          >
            {step.on ? <Check className="mx-auto mb-1 size-3" aria-hidden /> : null}
            {step.label}
          </li>
        ))}
      </ol>

      <p className={`mt-5 inline-flex rounded-full px-3 py-1 text-sm ${life === "ok" ? "bg-good-soft text-good" : life === "going" ? "bg-amber-soft text-amber-ink" : life === "false" ? "bg-secondary text-muted-foreground" : "border border-alert text-alert"}`}>
        {pill.label}
      </p>
      <h1 className="mt-3 text-2xl font-semibold capitalize">{alertTitle(alert, lang)}</h1>
      {quote ? <p className="font-devanagari mt-2 text-lg leading-[1.6]">“{quote}”</p> : null}
      <p className="mt-1 text-sm text-muted-foreground">{formatFriendlyTime(alert.created_at, lang)}</p>

      <section className="mt-5 rounded-2xl border border-border bg-card px-4 py-3">
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
          <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-white">
            {t.imOnIt}
          </button>
        </form>
      ) : null}

      {life === "open" || life === "going" ? (
        <div className="mt-3 space-y-2">
          <form action={markOk}>
            <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border">
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
    </FamilyFrame>
  );
}
