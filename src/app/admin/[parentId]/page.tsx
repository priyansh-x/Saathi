import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { titled } from "@/lib/page-title";
import { loadAdminHousehold } from "@/lib/admin/data";
import { getAdminGate } from "@/lib/admin/gate";
import { ActionForm } from "@/components/admin/action-form";

export const metadata: Metadata = {
  ...titled("Household · Admin", "परिवार · एडमिन"),
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminHouseholdPage({
  params,
  searchParams,
}: {
  params: Promise<{ parentId: string }>;
  searchParams: Promise<{ err?: string; call?: string }>;
}) {
  const gate = await getAdminGate();
  if (!gate.ok) notFound();
  const { parentId } = await params;
  const sp = await searchParams;
  const data = await loadAdminHousehold(parentId);
  if (!data) notFound();
  const next = `/admin/${parentId}`;
  const { parent } = data;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-16">
      <Link href="/admin" className="text-sm font-medium text-primary">
        ← All households
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{parent.full_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {parent.city} · {parent.timezone} · {parent.phone} · {parent.languages} · call {parent.call_time} ·
            consent {parent.consent_status}
            {parent.consent_at ? ` (${parent.consent_at})` : ""}
            {parent.recording_consent ? " · recording yes" : " · recording no"}
            {parent.address_term ? ` · ${parent.address_term}` : ""}
            {parent.is_example ? " · EXAMPLE" : ""}
            {parent.paused ? " · paused" : ""}
          </p>
          <p className="mt-1 font-mono text-xs text-ink-3">{parent.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {parent.paused ? (
            <ActionForm action="resume" parentId={parent.id} next={next} label="Resume calls" />
          ) : (
            <ActionForm action="pause" parentId={parent.id} next={next} label="Pause" />
          )}
          <ActionForm action="ring" parentId={parent.id} next={next} label="Call now" />
          <ActionForm action="backfill" parentId={parent.id} next={next} label="Scan alerts" />
          {data.deskUrl ? (
            <a href={data.deskUrl} className="btn-secondary" target="_blank" rel="noreferrer">
              Open desk
            </a>
          ) : null}
        </div>
      </div>
      {sp.err ? <p className="mt-3 text-sm text-alert">Action failed: {sp.err}</p> : null}
      {sp.call ? <p className="mt-3 text-sm text-good">Call placed · {sp.call}</p> : null}

      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">People</h2>
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {data.contacts.map((row) => (
            <li key={row.id} className="px-4 py-3 text-sm">
              <p className="font-medium">
                {row.full_name} · {row.role}
                {row.is_owner ? " · owner" : ""}
              </p>
              <p className="text-muted-foreground">
                {row.phone}
                {row.email ? ` · ${row.email}` : ""} · {row.locale}
                {row.last_inbound_at ? ` · inbound ${row.last_inbound_at}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Medicines</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {data.medicines.length === 0 ? (
            <li className="text-muted-foreground">None listed.</li>
          ) : (
            data.medicines.map((row) => (
              <li key={row.id}>
                {row.name} · {row.dose} · {row.meal}
                {row.time_local ? ` · ${row.time_local}` : ""} · {row.appearance}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Alerts</h2>
        <ul className="mt-3 space-y-3">
          {data.alerts.length === 0 ? (
            <li className="text-sm text-muted-foreground">None.</li>
          ) : (
            data.alerts.map((alert) => (
              <li key={alert.id} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm">
                <p className="font-medium">
                  {alert.category} · {alert.level} · {alert.source}
                  {alert.resolved_at ? " · resolved" : alert.acked_at ? " · going" : " · open"}
                </p>
                <p className="font-devanagari mt-1">“{alert.quote}”</p>
                <p className="mt-1 text-xs text-ink-3">
                  {alert.created_at}
                  {alert.acked_by ? ` · ${alert.acked_by}` : ""}
                </p>
                {!alert.resolved_at ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <ActionForm action="ack_alert" parentId={parent.id} alertId={alert.id} next={next} label="Ack" />
                    <ActionForm action="resolve_alert" parentId={parent.id} alertId={alert.id} next={next} label="She's ok" />
                    <ActionForm action="false_alarm" parentId={parent.id} alertId={alert.id} next={next} label="False" />
                  </div>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Calls</h2>
          <ul className="mt-3 space-y-3">
          {data.calls.length === 0 ? (
            <li className="text-sm text-muted-foreground">No calls stored.</li>
          ) : null}
          {data.calls.map((call) => (
            <li key={call.id} className="rounded-2xl border border-border bg-card px-4 py-3">
              <p className="text-sm font-medium">
                {call.status} · {call.started_at}
                {call.duration_sec != null ? ` · ${call.duration_sec}s` : ""}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{call.summary_en || "No summary."}</p>
              {call.mood_quote ? <p className="font-devanagari mt-1 text-sm">“{call.mood_quote}”</p> : null}
              <p className="mt-1 font-mono text-[11px] text-ink-3">
                {call.id}
                {call.recording_url ? ` · ${call.recording_url}` : ""}
              </p>
              {call.lines.length > 0 ? (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">Transcript ({call.lines.length})</summary>
                  <ol className="mt-2 space-y-1 text-sm">
                    {call.lines.map((line, i) => (
                      <li key={i}>
                        <span className="text-ink-3">{line.speaker}: </span>
                        <span className="font-devanagari">{line.hi || line.en}</span>
                      </li>
                    ))}
                  </ol>
                </details>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No transcript stored.</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Doses</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {data.doses.length === 0 ? <li className="text-muted-foreground">None.</li> : null}
            {data.doses.slice(0, 20).map((row) => (
              <li key={row.id}>
                {row.schedule_date} · {row.name} · {row.status}
                {row.said ? ` · “${row.said}”` : ""}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Consents</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {data.consents.length === 0 ? (
              <li className="text-muted-foreground">None recorded.</li>
            ) : (
              data.consents.map((row) => (
                <li key={`${row.kind}-${row.at}`}>
                  {row.kind} · {row.granted ? "yes" : "no"} · {row.at}
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Outbound</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {data.outbound.length === 0 ? <li className="text-muted-foreground">None sent.</li> : null}
          {data.outbound.map((row) => (
            <li key={row.id}>
              <span className="font-medium">
                {row.channel} · {row.template} · {row.status}
              </span>
              <span className="text-ink-3">
                {" "}
                · {row.to_phone} · {row.at}
              </span>
              <p className="line-clamp-3 text-muted-foreground">{row.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Ladder attempts</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {data.attempts.length === 0 ? (
              <li className="text-muted-foreground">None.</li>
            ) : (
              data.attempts.map((row, i) => (
                <li key={`${row.call_id}-${row.offset_min}-${i}`}>
                  +{row.offset_min}m · {row.result} · {row.attempted_at}
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Push · notes · desk</h2>
          <p className="mt-3 text-sm">{data.push.length} device(s)</p>
          <ul className="mt-2 space-y-1 break-all text-xs text-ink-3">
            {data.push.map((row) => (
              <li key={row.id}>
                {row.created_at} · {row.endpoint.slice(0, 80)}
              </li>
            ))}
          </ul>
          <ul className="mt-3 space-y-1 text-sm">
            {data.notes.map((row, i) => (
              <li key={i}>
                {row.kind}: {row.note}
              </li>
            ))}
          </ul>
          {data.config ? (
            <p className="mt-3 text-xs text-ink-3">
              ladder {data.config.retry_10}/{data.config.retry_25}/{data.config.soft_30}/{data.config.last_45}/
              {data.config.escalate_60}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
