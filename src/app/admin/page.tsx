import type { Metadata } from "next";
import Link from "next/link";
import { titled } from "@/lib/page-title";
import { adminPassword } from "@/lib/admin/auth";
import { loadAdminOverview } from "@/lib/admin/data";
import { getAdminGate } from "@/lib/admin/gate";
import { loadPilotMetrics } from "@/lib/admin/pilot";
import type { PilotHouseholdMetrics } from "@/lib/admin/pilot-metrics";
import { ActionForm } from "@/components/admin/action-form";

export const metadata: Metadata = {
  ...titled("Admin · Saathi", "एडमिन · साथी"),
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-semibold tracking-wide text-ink-3 uppercase">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular">{value}</p>
    </div>
  );
}

function pct(n: number) {
  return `${Math.round(n * 1000) / 10}%`;
}

function PilotTable({ rows }: { rows: PilotHouseholdMetrics[] }) {
  return (
    <table className="mt-4 min-w-[720px] w-full text-left text-sm">
      <thead>
        <tr className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">
          <th className="py-2 pr-3">Household</th>
          <th className="py-2 pr-3">Days</th>
          <th className="py-2 pr-3">Dials</th>
          <th className="py-2 pr-3">Answered</th>
          <th className="py-2 pr-3">Rate</th>
          <th className="py-2 pr-3">Median s</th>
          <th className="py-2 pr-3">Ans. days</th>
          <th className="py-2 pr-3">Streak</th>
          <th className="py-2 pr-3">Views/day</th>
          <th className="py-2 pr-3">Alerts</th>
          <th className="py-2">False</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.parentId} className={row.parentId === "totals" ? "font-semibold" : ""}>
            <td className="py-2 pr-3">{row.name}</td>
            <td className="py-2 pr-3 tabular">{row.daysEnrolled}</td>
            <td className="py-2 pr-3 tabular">{row.dials}</td>
            <td className="py-2 pr-3 tabular">{row.answered}</td>
            <td className="py-2 pr-3 tabular">{pct(row.answerRate)}</td>
            <td className="py-2 pr-3 tabular">{row.medianCallSeconds ?? "—"}</td>
            <td className="py-2 pr-3 tabular">{row.answeredDays}</td>
            <td className="py-2 pr-3 tabular">{row.answeredStreak}</td>
            <td className="py-2 pr-3 tabular">{row.deskViewsPerDay.toFixed(2)}</td>
            <td className="py-2 pr-3 tabular">{row.alertsRaised}</td>
            <td className="py-2 tabular">{row.alertsResolvedFalse}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const gate = await getAdminGate();
  const err = (await searchParams).err;
  if (!gate.ok) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-12">
        <p className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Saathi</p>
        <h1 className="mt-2 text-3xl font-semibold">Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Password for this desk. Ops emails that are already signed in can skip this.
        </p>
        {err ? <p className="mt-3 text-sm text-alert">That password did not match.</p> : null}
        {adminPassword() ? (
          <form action="/api/admin/login" method="POST" className="mt-6 space-y-3">
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Admin password"
              className="h-12 w-full rounded-full border border-border bg-card px-4"
            />
            <button type="submit" className="btn-primary w-full">
              Open dashboard
            </button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            Set <code>ADMIN_PASSWORD</code> on the host, or sign in with an address on <code>OPS_EMAILS</code>.
          </p>
        )}
      </main>
    );
  }

  const data = await loadAdminOverview();
  const pilot = await loadPilotMetrics();
  const todayN = data.todayCalls.reduce((sum, row) => sum + row.n, 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Internal</p>
          <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Households, calls, transcripts, alerts. Signed in via {gate.via}
            {gate.email ? ` · ${gate.email}` : ""}.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/ops" className="btn-secondary">
            Ops gates
          </Link>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="btn-secondary">
              Log out
            </button>
          </form>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <Stat label="Households" value={data.households.length} />
        <Stat label="Calls today" value={todayN} />
        <Stat label="Open alerts" value={data.openAlerts.length} />
        <Stat label="Accounts" value={data.accounts.length} />
        <Stat label="Push devices" value={data.pushN} />
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card px-4 py-4 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-ink-3 uppercase">Emergency stop</p>
            <p className={`mt-1 font-semibold ${data.flags.killSwitch ? "text-alert" : "text-good"}`}>
              {data.flags.killSwitch ? "Outbound is frozen" : "Outbound is allowed"}
            </p>
            <p className="mt-1 max-w-xl text-muted-foreground">
              This is not a household pause. It stops every call, WhatsApp, email, and push for every family until you
              turn it off. Use it if the wrong numbers are being dialed.
            </p>
            <p className="mt-2 text-xs text-ink-3">
              provider {data.flags.callProvider} · Bolna {data.flags.mockBolna ? "mock" : "live"} · WhatsApp{" "}
              {data.flags.mockWhatsapp ? "mock" : "live"} · Email {data.flags.mockEmail ? "mock" : "live"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionForm action="kill_on" next="/admin" label="Stop everything" danger />
            <ActionForm action="kill_off" next="/admin" label="Allow outbound" />
          </div>
        </div>
      </section>

      <section className="mt-8 overflow-x-auto rounded-2xl border border-border bg-card px-4 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Pilot</h2>
          <a href="/api/admin/pilot.csv" className="text-sm font-medium underline">
            Download CSV
          </a>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Non-example households only. EXAMPLE rows are excluded. Answered means a completed call with conversation
          duration above zero.
        </p>
        {pilot.rows.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No live households yet.</p>
        ) : (
          <PilotTable rows={[...pilot.rows, pilot.totals]} />
        )}
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Households</h2>
          <ul className="mt-3 space-y-3">
            {data.households.length === 0 ? (
              <li className="rounded-2xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
                No households yet.
              </li>
            ) : null}
            {data.households.map((row) => {
              const next = `/admin/${row.id}`;
              return (
                <li key={row.id} className="rounded-2xl border border-border bg-card px-4 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link href={next} className="font-semibold hover:underline">
                      {row.full_name}
                      {row.is_example ? <span className="ml-2 text-xs text-amber-ink">EXAMPLE</span> : null}
                      {row.paused ? <span className="ml-2 text-xs text-alert">paused</span> : null}
                    </Link>
                    <p className="text-xs text-ink-3">
                      {row.call_count} calls
                      {row.open_alerts ? ` · ${row.open_alerts} open alerts` : ""}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.city} · {row.phone} · {row.call_time} · {row.consent_status}
                    {row.owner_email ? ` · ${row.owner_email}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-3">
                    last {row.last_call_at || "—"} {row.last_call_status ? `· ${row.last_call_status}` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={next} className="btn-secondary">
                      Open
                    </Link>
                    {row.paused ? (
                      <ActionForm action="resume" parentId={row.id} next="/admin" label="Resume" />
                    ) : (
                      <ActionForm action="pause" parentId={row.id} next="/admin" label="Pause calls" />
                    )}
                    <ActionForm action="ring" parentId={row.id} next={next} label="Call now" />
                    {row.open_alerts ? (
                      <ActionForm action="resolve_open" parentId={row.id} next="/admin" label="Clear alerts" />
                    ) : null}
                    {row.desk_token ? (
                      <a href={`/d/${row.desk_token}`} className="btn-secondary" target="_blank" rel="noreferrer">
                        Desk
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Accounts</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {data.accounts.length === 0 ? (
                <li className="text-muted-foreground">No emails on contacts yet.</li>
              ) : (
                data.accounts.map((row) => (
                  <li key={`${row.parent_id}-${row.email}`}>
                    <Link href={`/admin/${row.parent_id}`} className="font-medium">
                      {row.email}
                    </Link>
                    <span className="text-muted-foreground">
                      {" "}
                      · {row.full_name} ({row.role}
                      {row.is_owner ? ", owner" : ""}) · {row.parent_name}
                      {row.last_inbound_at ? ` · inbound ${row.last_inbound_at}` : ""}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Open alerts</h2>
            <ul className="mt-3 space-y-3">
              {data.openAlerts.length === 0 ? (
                <li className="text-sm text-muted-foreground">None open.</li>
              ) : (
                data.openAlerts.map((alert) => (
                  <li key={alert.id} className="rounded-2xl border border-border bg-card px-3 py-2 text-sm">
                    <Link href={`/admin/${alert.parent_id}`} className="font-medium">
                      {alert.category} · {alert.level}
                    </Link>
                    <p className="font-devanagari mt-1">“{alert.quote}”</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <ActionForm action="ack_alert" parentId={alert.parent_id} alertId={alert.id} next="/admin" label="Ack" />
                      <ActionForm
                        action="resolve_alert"
                        parentId={alert.parent_id}
                        alertId={alert.id}
                        next="/admin"
                        label="She's ok"
                      />
                      <ActionForm
                        action="false_alarm"
                        parentId={alert.parent_id}
                        alertId={alert.id}
                        next="/admin"
                        label="False"
                      />
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Recent sign-in codes</h2>
            <ul className="mt-3 space-y-1 font-mono text-xs">
              {data.pendingCodes.length === 0 ? (
                <li className="font-sans text-sm text-muted-foreground">None stored.</li>
              ) : (
                data.pendingCodes.map((row) => (
                  <li key={`${row.email}-${row.created_at}`}>
                    {row.email} · {row.consumed_at ? "used" : "open"} · {row.created_at}
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Latest calls</h2>
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {data.recentCalls.length === 0 ? (
            <li className="px-4 py-4 text-sm text-muted-foreground">No calls yet.</li>
          ) : null}
          {data.recentCalls.map((call) => (
            <li key={call.id} className="px-4 py-3 text-sm">
              <Link href={`/admin/${call.parent_id}`} className="font-medium">
                {call.status} · {call.started_at}
              </Link>
              <p className="mt-1 text-muted-foreground">{call.summary_en || call.mood_quote || "No summary."}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Outbound</h2>
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card text-sm">
          {data.outbound.length === 0 ? (
            <li className="px-4 py-4 text-muted-foreground">None sent.</li>
          ) : null}
          {data.outbound.map((row) => (
            <li key={row.id} className="px-4 py-2">
              <span className="font-medium">
                {row.channel} · {row.template} · {row.status}
              </span>
              <span className="text-ink-3">
                {" "}
                · {row.to_phone} · {row.at}
              </span>
              <p className="mt-1 line-clamp-2 text-muted-foreground">{row.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Errors</h2>
        {data.errors.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">None logged.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {data.errors.map((row) => (
              <li key={row.id}>
                <span className="text-ink-3">{row.at}</span> · {row.where_at}
                <p>{row.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Webhooks</h2>
        {data.webhooks.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">None stored.</p>
        ) : (
          <ul className="mt-3 space-y-1 font-mono text-xs">
            {data.webhooks.map((row) => (
              <li key={row.id}>
                {row.at} · {row.source}
                {row.execution_id ? ` · ${row.execution_id}` : ""} · {row.processed ? "processed" : "pending"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-10 text-xs text-ink-3">
        Waitlist count {data.waitlist ?? "n/a"} · {data.flags.publicBase}
      </p>
    </main>
  );
}
