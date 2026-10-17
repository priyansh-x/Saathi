import Link from "next/link";
import { AlertTriangle, Bell, CalendarDays, House, Settings } from "lucide-react";
import type { AlertRow } from "@/lib/db/types";
import { messages, type Lang } from "@/lib/i18n/messages";
import { categoryWords, humanQuote } from "@/lib/today";
import { formatFriendlyTime, formatHeaderDate, formatUpdated } from "@/lib/time";

export function ExamplePill({ lang }: { lang: Lang }) {
  return (
    <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[11px] font-medium text-amber-ink">
      {messages[lang].example}
    </span>
  );
}

export function ActBanner({
  token,
  lang,
  alerts,
}: {
  token: string;
  lang: Lang;
  alerts: AlertRow[];
}) {
  if (alerts.length === 0) return null;
  const first = alerts[0];
  const extra = alerts.length > 1 ? ` · ${alerts.length}` : "";
  const { hh, mm } = (() => {
    const time = first.created_at.includes("T") ? first.created_at.slice(11, 16) : "";
    return { hh: time.slice(0, 2), mm: time.slice(3, 5) };
  })();
  const clock = hh ? `${Number(hh) % 12 || 12}:${mm} ${Number(hh) < 12 ? "AM" : "PM"}` : formatFriendlyTime(first.created_at, lang);
  return (
    <Link
      href={`/d/${token}/alerts/${first.id}?lang=${lang}`}
      className="mx-4 mt-2 flex min-h-11 items-center justify-between rounded-2xl bg-alert px-3 py-2 text-sm text-white"
    >
      <span>
        <AlertTriangle className="mr-1 inline size-4" aria-hidden />
        {messages[lang].act} · {categoryWords(first.category, lang)} · {clock}
        {extra}
      </span>
      <span className="font-medium">
        {messages[lang].open} ›
      </span>
    </Link>
  );
}

export function TopBar({
  lang,
  example,
  updatedAt,
}: {
  lang: Lang;
  example?: boolean;
  updatedAt?: string | null;
}) {
  const next = lang === "en" ? "hi" : "en";
  const t = messages[lang];
  return (
    <header className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <span>{t.maa}</span>
          {example ? <ExamplePill lang={lang} /> : null}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatHeaderDate(lang)} · {t.updated} {formatUpdated(updatedAt, lang).replace(/^Today |^आज /, "")}
        </p>
      </div>
      <Link
        href={`?lang=${next}`}
        className="inline-flex h-11 min-w-11 items-center justify-center rounded-2xl border border-border px-3 text-sm"
      >
        {lang === "en" ? "हिं" : "EN"}
      </Link>
    </header>
  );
}

export function TabBar({ token, lang, active }: { token: string; lang: Lang; active: string }) {
  const t = messages[lang];
  const items = [
    { href: `/d/${token}`, key: "today", label: t.today, icon: House },
    { href: `/d/${token}/history`, key: "history", label: t.history, icon: CalendarDays },
    { href: `/d/${token}/alerts`, key: "alerts", label: t.alerts, icon: Bell },
    { href: `/d/${token}/settings`, key: "settings", label: t.settings, icon: Settings },
  ];
  return (
    <nav className="sticky bottom-0 border-t border-border bg-background">
      <ul className="mx-auto grid max-w-[480px] grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const on = active === item.key;
          return (
            <li key={item.key}>
              <Link
                href={`${item.href}?lang=${lang}`}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-xs ${on ? "text-primary" : "text-muted-foreground"}`}
              >
                <Icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function FamilyFrame({
  token,
  lang,
  example,
  alerts,
  active,
  children,
  updatedAt,
}: {
  token: string;
  lang: Lang;
  example: boolean;
  alerts: AlertRow[];
  active: string;
  children: React.ReactNode;
  updatedAt?: string | null;
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-[480px] flex-col">
      <TopBar lang={lang} example={example} updatedAt={updatedAt} />
      {active !== "today" ? <ActBanner token={token} lang={lang} alerts={alerts} /> : null}
      <div className="flex-1 px-4 pb-8">{children}</div>
      <TabBar token={token} lang={lang} active={active} />
    </div>
  );
}

export function ExpiredLink() {
  return (
    <main className="mx-auto max-w-[480px] px-4 py-16">
      <h1 className="text-2xl font-semibold">Link expired or unknown</h1>
      <p className="mt-3 text-muted-foreground">Ask for a new WhatsApp link, or open the example desk.</p>
      <Link
        href="/d/example-kamla"
        className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-white"
      >
        Open example desk
      </Link>
    </main>
  );
}

export function LoadingState({ lang = "en" }: { lang?: Lang }) {
  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-10">
      <p className="text-sm text-muted-foreground">{lang === "hi" ? "खुल रहा है…" : "Opening…"}</p>
      <div className="mt-4 h-28 animate-pulse rounded-2xl bg-card" />
      <div className="mt-3 h-16 animate-pulse rounded-2xl bg-card" />
      <div className="mt-3 h-16 animate-pulse rounded-2xl bg-card" />
    </div>
  );
}

export function ErrorState({
  lang = "en",
  onRetry,
}: {
  lang?: Lang;
  onRetry?: () => void;
}) {
  return (
    <div className="mx-auto max-w-[480px] space-y-3 px-4 py-10">
      <p>{messages[lang].loadError}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-white"
      >
        {messages[lang].retry}
      </button>
    </div>
  );
}

export { humanQuote };
