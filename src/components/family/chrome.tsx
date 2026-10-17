import Link from "next/link";
import { Bell, CalendarDays, House, Settings } from "lucide-react";
import type { AlertRow } from "@/lib/db/types";
import { messages, type Lang } from "@/lib/i18n/messages";
import { productName } from "@/lib/time";

export function ExampleRibbon({ lang }: { lang: Lang }) {
  return (
    <p className="bg-amber-soft px-4 py-2 text-center text-sm font-medium text-amber-ink">
      {messages[lang].example}
    </p>
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
  return (
    <Link
      href={`/d/${token}/alerts/${first.id}?lang=${lang}`}
      className="block bg-alert px-4 py-3 text-sm text-white"
    >
      <span className="font-medium">{messages[lang].act}</span>
      <span className="mt-1 block opacity-95">“{first.quote}”</span>
    </Link>
  );
}

export function TopBar({ lang }: { lang: Lang }) {
  const next = lang === "en" ? "hi" : "en";
  return (
    <header className="flex items-center justify-between px-4 py-3">
      <p className="text-lg font-semibold">{productName()}</p>
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
}: {
  token: string;
  lang: Lang;
  example: boolean;
  alerts: AlertRow[];
  active: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-[480px] flex-col">
      {example ? <ExampleRibbon lang={lang} /> : null}
      <ActBanner token={token} lang={lang} alerts={alerts} />
      <TopBar lang={lang} />
      <div className="flex-1 px-4 pb-8">{children}</div>
      <TabBar token={token} lang={lang} active={active} />
    </div>
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
    <div className="mx-auto w-full max-w-[480px] space-y-3 px-4 py-10">
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
