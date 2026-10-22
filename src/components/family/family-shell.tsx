import { ActBanner, TabBar, TopBar } from "@/components/family/chrome";
import { DeskNotifyPrompt } from "@/components/pwa/desk-notify";
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
  parentName,
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
  parentName?: string | null;
}) {
  const safeAlerts = clientSafe(alerts ?? []);
  const query = extraRecord(extraQuery);
  return (
    <div className="app-shell">
      <TopBar
        token={token}
        lang={lang}
        example={Boolean(example)}
        updatedAt={toIsoString(updatedAt) || null}
        extraQuery={query}
        parentName={parentName || undefined}
      />
      {token ? <DeskNotifyPrompt token={token} lang={lang} /> : null}
      {active !== "today" && active !== "alerts" ? <ActBanner token={token} lang={lang} alerts={safeAlerts} /> : null}
      <div className="app-shell-scroll px-4 pt-1 pb-6">{children}</div>
      <TabBar token={token} lang={lang} active={active} openAlerts={safeAlerts.length} extraQuery={query} />
    </div>
  );
}
