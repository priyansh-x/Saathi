import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { titled } from "@/lib/page-title";
import { BrandMark } from "@/components/brand";
import { decodeSession, SESSION_COOKIE } from "@/lib/auth/session";
import { canViewOps } from "@/lib/ops/access";
import { setOpsKillSwitch } from "@/lib/ops/kill-switch";
import { postSimulateBolnaWebhook } from "@/lib/ops/bolna-readiness";
import { loadOpsSnapshot } from "@/lib/ops/snapshot";

export const metadata: Metadata = titled("Ops · Saathi", "ऑप्स · साथी");

export default async function OpsPage() {
  const email = decodeSession((await cookies()).get(SESSION_COOKIE)?.value)?.email ?? null;
  if (!canViewOps(email)) notFound();

  const snap = await loadOpsSnapshot();
  const who = email as string;

  async function turnOn() {
    "use server";
    const session = decodeSession((await cookies()).get(SESSION_COOKIE)?.value);
    if (!canViewOps(session?.email)) notFound();
    await setOpsKillSwitch(true, session!.email);
    redirect("/ops");
  }

  async function turnOff() {
    "use server";
    const session = decodeSession((await cookies()).get(SESSION_COOKIE)?.value);
    if (!canViewOps(session?.email)) notFound();
    await setOpsKillSwitch(false, session!.email);
    redirect("/ops");
  }

  async function simulateBolna() {
    "use server";
    const session = decodeSession((await cookies()).get(SESSION_COOKIE)?.value);
    if (!canViewOps(session?.email)) notFound();
    await postSimulateBolnaWebhook();
    redirect("/ops");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[720px] flex-col px-5 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <BrandMark />
      <h1 className="app-title mt-6 text-[1.75rem]">Ops</h1>
      <p className="mt-1 text-sm text-muted-foreground">Counts and gates only. No transcripts, quotes, or names.</p>
      <p className="mt-1 text-xs text-ink-3">{who}</p>

      <section className="card mt-6 p-4">
        <h2 className="text-sm font-medium text-ink-3">Kill switch</h2>
        <p className="mt-1 text-lg font-medium">{snap.killSwitch.on ? "On — nothing goes out" : "Off — outbound follows allowlists"}</p>
        {snap.killSwitch.env ? <p className="mt-1 text-sm text-alert">SAATHI_KILL_SWITCH=1 in env still forces on.</p> : null}
        <div className="mt-4 flex gap-3">
          <form action={turnOn} className="flex-1">
            <button type="submit" className="btn-primary">
              Turn on
            </button>
          </form>
          <form action={turnOff} className="flex-1">
            <button type="submit" className="btn-secondary">
              Turn off
            </button>
          </form>
        </div>
      </section>

      <section className="card mt-4 p-4">
        <h2 className="text-sm font-medium text-ink-3">Bolna readiness</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Green or red only. Secrets and full numbers are never shown. Reachable means our own /api/health answered over HTTPS.
          Last Bolna webhook counts real deliveries only.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {snap.bolna.checks.map((row) => (
            <li key={row.id} className="flex flex-wrap justify-between gap-2">
              <span className={row.ok ? "text-good" : "text-alert"}>{row.ok ? "Green" : "Red"}</span>
              <span className="flex-1">
                {row.label}
                <span className="text-ink-3"> · {row.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <form action={simulateBolna} className="mt-4">
          <button type="submit" className="btn-secondary">
            Simulate a Bolna webhook
          </button>
        </form>
        <p className="mt-2 text-xs text-ink-3">Simulate is separate. It does not count as the last Bolna webhook.</p>
      </section>

      <section className="card mt-4 p-4">
        <h2 className="text-sm font-medium text-ink-3">WhatsApp readiness</h2>
        <p className="mt-1 text-sm text-muted-foreground">Green or red only. Tokens, ids, and secrets are never shown.</p>
        <ul className="mt-3 space-y-2 text-sm">
          {snap.whatsapp.checks.map((row) => (
            <li key={row.id} className="flex flex-wrap justify-between gap-2">
              <span className={row.ok ? "text-good" : "text-alert"}>{row.ok ? "Green" : "Red"}</span>
              <span className="flex-1">
                {row.label}
                <span className="text-ink-3"> · {row.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card mt-4 p-4">
        <h2 className="text-sm font-medium text-ink-3">Flags (read-only)</h2>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <dt className="text-ink-3">CALL_PROVIDER</dt>
          <dd>{snap.flags.callProvider}</dd>
          <dt className="text-ink-3">MOCK_BOLNA</dt>
          <dd>{snap.flags.mockBolna ? "1" : "0"}</dd>
          <dt className="text-ink-3">MOCK_WHATSAPP</dt>
          <dd>{snap.flags.mockWhatsapp ? "1" : "0"}</dd>
          <dt className="text-ink-3">MOCK_EMAIL</dt>
          <dd>{snap.flags.mockEmail ? "1" : "0"}</dd>
        </dl>
      </section>

      <section className="card mt-4 p-4">
        <h2 className="text-sm font-medium text-ink-3">Waitlist sign-ups</h2>
        <p className="mt-1 text-2xl font-medium">
          {snap.waitlistCount === null ? "count unavailable" : snap.waitlistCount}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Count only. No emails or names.</p>
      </section>

      <section className="card mt-4 p-4">
        <h2 className="text-sm font-medium text-ink-3">Families</h2>
        <p className="mt-1 text-2xl font-medium">{snap.familyCount}</p>
        <ul className="mt-2 space-y-1 text-sm">
          {snap.familyCounts.map((row) => (
            <li key={row.status}>
              {row.status}: {row.n}
            </li>
          ))}
        </ul>
      </section>

      <section className="card mt-4 p-4">
        <h2 className="text-sm font-medium text-ink-3">Today’s calls</h2>
        {snap.todayCalls.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">None yet today.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {snap.todayCalls.map((row) => (
              <li key={row.status}>
                {row.status}: {row.n}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card mt-4 p-4">
        <h2 className="text-sm font-medium text-ink-3">Outbound log</h2>
        {snap.outbound.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No outbound rows.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border text-sm">
            {snap.outbound.map((row, i) => (
              <li key={`${row.at}-${i}`} className="flex flex-wrap justify-between gap-2 py-2">
                <span className={row.gate === "undelivered" || row.delivery === "undelivered" ? "text-alert" : undefined}>
                  {row.kind} · {row.gate} · {row.delivery}
                </span>
                <span className="text-ink-3">
                  {row.to} · {row.at}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card mt-4 p-4">
        <h2 className="text-sm font-medium text-ink-3">Recent errors</h2>
        {snap.errors.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">None logged.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border text-sm">
            {snap.errors.map((row) => (
              <li key={row.id} className="py-2">
                <span className="text-ink-3">{row.at}</span> · {row.where_at}
                <p className="mt-0.5">{row.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card mt-4 p-4">
        <h2 className="text-sm font-medium text-ink-3">Open alerts</h2>
        {snap.openAlerts.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">None open.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {snap.openAlerts.map((row) => (
              <li key={row.id}>
                {row.category} · {row.level}
                {row.late ? " · late" : ""} · {row.at}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
