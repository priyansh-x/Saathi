import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, CloudOff, Languages, Link2Off } from "lucide-react";
import { IconAlert, IconFamily, IconHistory, IconSettings, MarkSvg } from "@/components/icons";
import kamlaAvatar from "../../../public/images/avatar-kamla.jpg";
import type { AlertRow } from "@/lib/db/types";
import { qs } from "@/lib/history";
import { messages, type Lang } from "@/lib/i18n/messages";
import { categoryWords, humanQuote } from "@/lib/today";
import { formatFriendlyTime, formatHeaderDate, formatUpdated } from "@/lib/time";

export function ExamplePill({ lang }: { lang: Lang }) {
  return (
    <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[11px] font-semibold tracking-wide text-amber-ink">
      {messages[lang].example}
    </span>
  );
}

export function Avatar({
  name,
  example,
  size = 44,
}: {
  name: string;
  example?: boolean;
  size?: number;
}) {
  const initial = (name.trim()[0] || "स").toUpperCase();
  if (example) {
    return (
      <Image
        src={kamlaAvatar}
        alt=""
        width={size}
        height={size}
        sizes={`${size}px`}
        className="shrink-0 rounded-full object-cover ring-2 ring-card"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full bg-brand-soft font-serif text-brand-deep ring-2 ring-card"
      style={{ width: size, height: size, fontSize: size * 0.48 }}
    >
      {initial}
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
  const time = first.created_at.includes("T") ? first.created_at.slice(11, 16) : "";
  const hh = time.slice(0, 2);
  const mm = time.slice(3, 5);
  const clock = hh ? `${Number(hh) % 12 || 12}:${mm} ${Number(hh) < 12 ? "AM" : "PM"}` : formatFriendlyTime(first.created_at, lang);
  return (
    <Link
      href={`/d/${token}/alerts/${first.id}${qs({ lang })}`}
      className="mx-4 mb-3 flex min-h-12 items-center gap-3 rounded-full bg-alert py-2 pr-4 pl-2 text-sm text-white shadow-[var(--shadow-float)]"
    >
      <span className="ring-pulse grid size-8 shrink-0 place-items-center rounded-full bg-white/15">
        <IconAlert className="size-4" />
      </span>
      <span className="min-w-0 flex-1 truncate">
        {categoryWords(first.category, lang)} · {clock}
        {extra}
      </span>
      <span className="flex items-center font-medium">
        {messages[lang].open}
        <ChevronRight className="size-4" aria-hidden />
      </span>
    </Link>
  );
}

export function TopBar({
  lang,
  example,
  updatedAt,
  extraQuery,
  addressTerm,
}: {
  lang: Lang;
  example?: boolean;
  updatedAt?: string | null;
  extraQuery?: Record<string, string | undefined>;
  addressTerm?: string;
}) {
  const next = lang === "en" ? "hi" : "en";
  const t = messages[lang];
  const name = addressTerm || t.maa;
  return (
    <header
      className="glass sticky top-0 z-20 flex items-center gap-3 px-4 pb-3"
      style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
    >
      <Avatar name={name} example={example} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className="truncate text-[17px] font-semibold tracking-tight">{name}</span>
          {example ? <ExamplePill lang={lang} /> : null}
        </p>
        <p className="mt-0.5 truncate text-xs text-ink-3">
          {formatHeaderDate(lang)} · {t.updated} {formatUpdated(updatedAt, lang).replace(/^Today |^आज /, "")}
        </p>
      </div>
      <Link
        href={qs({ ...extraQuery, lang: next })}
        aria-label={lang === "en" ? "हिंदी में देखें" : "View in English"}
        className="inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-medium"
      >
        <Languages className="size-4 text-ink-3" aria-hidden />
        {lang === "en" ? "हिं" : "EN"}
      </Link>
    </header>
  );
}

export function TabBar({
  token,
  lang,
  active,
  openAlerts = 0,
}: {
  token: string;
  lang: Lang;
  active: string;
  openAlerts?: number;
}) {
  const t = messages[lang];
  const items = [
    { href: `/d/${token}`, key: "today", label: t.today, icon: IconFamily },
    { href: `/d/${token}/history`, key: "history", label: t.history, icon: IconHistory },
    { href: `/d/${token}/alerts`, key: "alerts", label: t.alerts, icon: IconAlert },
    { href: `/d/${token}/settings`, key: "settings", label: t.settings, icon: IconSettings },
  ];
  return (
    <nav
      className="glass fixed right-0 bottom-0 left-0 z-20 border-t border-border/70"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-[480px] grid-cols-4 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const on = active === item.key;
          return (
            <li key={item.key}>
              <Link
                href={`${item.href}${qs({ lang })}`}
                prefetch={false}
                aria-current={on ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[12px] ${
                  on ? "font-semibold text-foreground" : "text-ink-3"
                }`}
              >
                <span
                  className={`relative grid h-8 w-14 place-items-center rounded-full ${on ? "bg-brand-soft text-brand-deep" : ""}`}
                >
                  <Icon className="size-[21px]" strokeWidth={on ? 2.2 : 1.8} />
                  {item.key === "alerts" && openAlerts > 0 ? (
                    <span className="absolute -top-0.5 right-2 min-w-[18px] rounded-full bg-alert px-1 text-center text-[10px] leading-[18px] text-white ring-2 ring-background">
                      {openAlerts}
                    </span>
                  ) : null}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function PageTitle({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="mb-4 px-1">
      <h1 className="text-[26px] leading-tight font-semibold tracking-tight">{children}</h1>
      {sub ? <p className="mt-1 text-[15px] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body?: string;
}) {
  return (
    <div className="card grain flex flex-col items-center px-6 py-10 text-center">
      <MarkSvg className="mb-4 size-12" />
      <p className="text-[17px] font-semibold">{title}</p>
      {body ? <p className="mt-1.5 max-w-[30ch] text-[15px] text-muted-foreground">{body}</p> : null}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  const label = typeof children === "string" ? children.replace(/^←\s*/, "") : children;
  return (
    <Link href={href} className="-ml-2 inline-flex h-11 items-center gap-0.5 pr-3 text-[15px] font-medium text-primary">
      <ChevronLeft className="size-5" aria-hidden />
      {label}
    </Link>
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
  extraQuery,
  addressTerm,
}: {
  token: string;
  lang: Lang;
  example: boolean;
  alerts: AlertRow[];
  active: string;
  children: React.ReactNode;
  updatedAt?: string | null;
  extraQuery?: Record<string, string | undefined>;
  addressTerm?: string | null;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      <TopBar
        lang={lang}
        example={example}
        updatedAt={updatedAt}
        extraQuery={extraQuery}
        addressTerm={addressTerm || undefined}
      />
      {active !== "today" ? <ActBanner token={token} lang={lang} alerts={alerts} /> : null}
      <div className="flex-1 px-4 pt-1 pb-28">{children}</div>
      <TabBar token={token} lang={lang} active={active} openAlerts={alerts.length} />
    </div>
  );
}

export function ExpiredLink({ lang = "en" }: { lang?: Lang }) {
  const t = messages[lang];
  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col justify-center px-6 py-16">
      <span className="grid size-14 place-items-center rounded-full bg-brand-soft text-brand-deep">
        <Link2Off className="size-6" aria-hidden />
      </span>
      <h1 className="app-title mt-5">{t.linkExpired}</h1>
      <p className="mt-3 text-[16px] text-muted-foreground">{t.linkExpiredHint}</p>
      <Link href="/" className="btn-secondary mt-8">
        Saathi
      </Link>
    </main>
  );
}

export function LoadingState({ lang = "en" }: { lang?: Lang }) {
  return (
    <div className="mx-auto w-full max-w-[480px] px-4 pt-6" aria-busy>
      <div className="flex items-center gap-3">
        <div className="size-11 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
      </div>
      <p className="sr-only">{messages[lang].opening}</p>
      <div className="mt-6 h-52 animate-pulse rounded-[28px] bg-card" />
      <div className="mt-4 h-24 animate-pulse rounded-[22px] bg-card" />
      <div className="mt-4 h-24 animate-pulse rounded-[22px] bg-card" />
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
    <div className="mx-auto max-w-[480px] px-6 py-16">
      <span className="grid size-14 place-items-center rounded-full bg-amber-soft text-amber-ink">
        <CloudOff className="size-6" aria-hidden />
      </span>
      <p className="mt-5 text-[19px] font-semibold">{messages[lang].loadError}</p>
      <button type="button" onClick={onRetry} className="btn-primary mt-6">
        {messages[lang].retry}
      </button>
    </div>
  );
}

export { humanQuote };
