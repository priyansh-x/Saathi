import { Suspense } from "react";
import { AlertsPanel } from "@/components/family/alerts-panel";
import { ExpiredLink, PaneBusy } from "@/components/family/chrome";
import { DeskPager } from "@/components/family/desk-pager";
import { HistoryPanel } from "@/components/family/history-panel";
import { SettingsPanel } from "@/components/family/settings-panel";
import { TodayPanel } from "@/components/family/today-panel";
import type { DeskTab } from "@/lib/desk-tabs";
import { clientSafe } from "@/lib/client-safe";
import { loadFamily } from "@/lib/family-load";
import type { Lang } from "@/lib/i18n/messages";
import { toIsoString } from "@/lib/time";

export async function DeskScreen({
  token,
  lang,
  active,
  callParam,
  days = 30,
  confirm,
}: {
  token: string;
  lang: Lang;
  active: DeskTab;
  callParam?: string;
  days?: 7 | 30;
  confirm?: string;
}) {
  const data = await loadFamily(token, { allAlerts: false, hydrateBolna: false });
  if (!data) return <ExpiredLink lang={lang} />;
  const alert = data.actAlerts[0] ?? null;
  const updatedAt = toIsoString(alert?.created_at || data.call?.ended_at || data.call?.started_at) || null;

  return (
    <DeskPager
      token={token}
      lang={lang}
      active={active}
      example={Boolean(data.parent.is_example)}
      alerts={clientSafe(data.actAlerts)}
      addressTerm={data.parent.address_term}
      updatedAt={updatedAt}
      extraQuery={days === 7 ? { days: "7" } : undefined}
      today={<TodayPanel token={token} lang={lang} data={data} callParam={callParam} />}
      history={
        <Suspense fallback={<PaneBusy />}>
          <HistoryPanel token={token} lang={lang} data={data} days={days} />
        </Suspense>
      }
      alertsPage={
        <Suspense fallback={<PaneBusy />}>
          <AlertsPanel token={token} lang={lang} parentId={data.parent.id} />
        </Suspense>
      }
      settings={
        <Suspense fallback={<PaneBusy />}>
          <SettingsPanel token={token} lang={lang} data={data} confirm={confirm} />
        </Suspense>
      }
    />
  );
}
