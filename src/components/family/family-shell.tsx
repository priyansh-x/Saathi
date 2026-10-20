import { ActBanner, TabBar, TopBar } from "@/components/family/chrome";
import { clientSafe } from "@/lib/client-safe";
import type { AlertRow } from "@/lib/db/types";
import type { Lang } from "@/lib/i18n/messages";
import { toIsoString } from "@/lib/time";

function extraRecord(extra?: Record<string, string | undefined>) {
  if (!extra) return undefined;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(extra)) {
    if (value) out[key] = value;
  }
  return Object.keys(out).length ? out : undefined;
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
  const safeAlerts = clientSafe(alerts ?? []);
  const query = extraRecord(extraQuery);
  return (
    <div className="app-shell">
      <TopBar
        lang={lang}
        example={Boolean(example)}
        updatedAt={toIsoString(updatedAt) || null}
        extraQuery={query}
        addressTerm={addressTerm || undefined}
      />
      {active !== "today" ? <ActBanner token={token} lang={lang} alerts={safeAlerts} /> : null}
      <div className="app-shell-scroll px-4 pt-1 pb-6">{children}</div>
      <TabBar token={token} lang={lang} active={active} openAlerts={safeAlerts.length} extraQuery={query} />
    </div>
  );
}
