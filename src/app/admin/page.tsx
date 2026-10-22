import type { Metadata } from "next";
import Link from "next/link";
import { titled } from "@/lib/page-title";
import { adminPassword } from "@/lib/admin/auth";
import { loadAdminOverview } from "@/lib/admin/data";
import { getAdminGate } from "@/lib/admin/gate";
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

      <section className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm">
        <span className={data.flags.killSwitch ? "font-semibold text-alert" : "text-good"}>
          Kill switch {data.flags.killSwitch ? "on" : "off"}
        </span>
        <span className="text-ink-3">·</span>
        <span>provider {data.flags.callProvider}</span>
        <span className="text-ink-3">·</span>
        <span>Bolna {data.flags.mockBolna ? "mock" : "live"}</span>
        <span className="text-ink-3">·</span>
        <span>WhatsApp {data.flags.mockWhatsapp ? "mock" : "live"}</span>
        <span className="text-ink-3">·</span>
        <span>Email {data.flags.mockEmail ? "mock" : "live"}</span>
        <span className="ml-auto flex gap-2">
          <ActionForm action="kill_on" next="/admin" label="Kill on" danger />
          <ActionForm action="kill_off" next="/admin" label="Kill off" />
        </span>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Households</h2>
          <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {data.households.length === 0 ? (
              <li className="px-4 py-6 text-sm text-muted-foreground">No households yet.</li>
            ) : null}
            {data.households.map((row) => (
              <li key={row.id}>
                <Link href={`/admin/${row.id}`} className="block px-4 py-3 hover:bg-sunk">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">
                      {row.full_name}
                      {row.is_example ? <span className="ml-2 text-xs text-amber-ink">EXAMPLE</span> : null}
                      {row.paused ? <span className="ml-2 text-xs text-alert">paused</span> : null}
                    </p>
                    <p className="text-xs text-ink-3">
                      {row.call_count} calls
                      {row.open_alerts ? ` · ${row.open_alerts} alerts` : ""}
                    </p>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {row.city} · {row.phone} · {row.call_time} · {row.consent_status}
                    {row.owner_email ? ` · ${row.owner_email}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-3">
                    last {row.last_call_at || "—"} {row.last_call_status ? `· ${row.last_call_status}` : ""}
                  </p>
                </Link>
              </li>
            ))}
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
