import { ActBanner, TabBar, TopBar } from "@/components/family/chrome";
import type { AlertRow } from "@/lib/db/types";
import type { Lang } from "@/lib/i18n/messages";
import { toIsoString } from "@/lib/time";

function plain<T>(value: T): T {
  try {
    return JSON.parse(
      JSON.stringify(value, (_key, item) => (item instanceof Date ? item.toISOString() : item)),
    ) as T;
  } catch {
    return [] as T;
  }
}

export function FamilyShell({
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
  updatedAt?: string | Date | null;
  extraQuery?: Record<string, string | undefined>;
  addressTerm?: string | null;
}) {
  const safeAlerts = plain(alerts ?? []);
  return (
    <div className="app-shell">
      <TopBar
        lang={lang}
        example={example}
        updatedAt={toIsoString(updatedAt) || null}
        extraQuery={extraQuery}
        addressTerm={addressTerm || undefined}
      />
      {active !== "today" ? <ActBanner token={token} lang={lang} alerts={safeAlerts} /> : null}
      <div className="app-shell-scroll px-4 pt-1 pb-6">{children}</div>
      <TabBar token={token} lang={lang} active={active} openAlerts={safeAlerts.length} extraQuery={extraQuery} />
    </div>
  );
}
