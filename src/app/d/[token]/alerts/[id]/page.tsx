import Link from "next/link";
import { ExpiredLink, FamilyFrame } from "@/components/family/chrome";
import { alertById, alertEvents, resolveAlert } from "@/lib/db/queries";
import { loadFamily, readLang } from "@/lib/family-load";
import { messages } from "@/lib/i18n/messages";
import { formatWhen } from "@/lib/time";
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

  async function resolve() {
    "use server";
    await resolveAlert(id);
    redirect(`/d/${token}/alerts/${id}?lang=${lang}`);
  }

  return (
    <FamilyFrame token={token} lang={lang} example={data.parent.is_example} alerts={data.actAlerts} active="alerts">
      <p className="tabular text-sm text-muted-foreground">{formatWhen(alert.created_at)}</p>
      <h1 className="font-devanagari mt-2 text-2xl leading-[1.6]">“{alert.quote}”</h1>
      <p className="mt-4 text-sm">
        {lang === "hi" ? "सूचना" : "Notified"}: {data.child?.full_name}, {data.neighbour?.full_name}
      </p>
      <p className="mt-2 text-sm">
        {alert.acked_by
          ? `${t.acked} — ${alert.acked_by}`
          : lang === "hi"
            ? "अभी कोई नहीं गया।"
            : "Nobody has said they are going."}
      </p>
      <p className="mt-2 text-sm">
        {alert.resolved_at ? t.resolved : lang === "hi" ? "अभी पक्का नहीं।" : "Not confirmed OK yet."}
      </p>
      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        {events.map((event) => (
          <li key={event.id} className="tabular">
            {formatWhen(event.at)} · {event.kind} · {event.actor} · {event.note}
          </li>
        ))}
      </ul>
      {!alert.resolved_at ? (
        <form action={resolve} className="mt-6">
          <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-white">
            {t.resolve}
          </button>
        </form>
      ) : null}
      <Link href={`/d/${token}/alerts?lang=${lang}`} className="mt-3 inline-flex h-11 w-full items-center justify-center">
        {lang === "hi" ? "वापस" : "Back"}
      </Link>
    </FamilyFrame>
  );
}
