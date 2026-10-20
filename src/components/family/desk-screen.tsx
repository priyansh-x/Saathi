import { AlertsPanel } from "@/components/family/alerts-panel";
import { ExpiredLink } from "@/components/family/chrome";
import { DeskPager } from "@/components/family/desk-pager";
import { HistoryPanel } from "@/components/family/history-panel";
import { SettingsPanel } from "@/components/family/settings-panel";
import { TodayPanel } from "@/components/family/today-panel";
import type { DeskTab } from "@/lib/desk-tabs";
import { loadFamily } from "@/lib/family-load";
import type { Lang } from "@/lib/i18n/messages";

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
  const data = await loadFamily(token, { allAlerts: true, hydrateBolna: true });
  if (!data) return <ExpiredLink lang={lang} />;
  const alert = data.actAlerts[0] ?? null;
  const updatedAt = alert?.created_at || data.call?.ended_at || data.call?.started_at;

  return (
    <DeskPager
      token={token}
      lang={lang}
      active={active}
      example={data.parent.is_example}
      alerts={data.actAlerts}
      addressTerm={data.parent.address_term}
      updatedAt={updatedAt}
      extraQuery={days === 7 ? { days: "7" } : undefined}
      today={<TodayPanel token={token} lang={lang} data={data} callParam={callParam} />}
      history={<HistoryPanel token={token} lang={lang} data={data} days={days} />}
      alertsPage={<AlertsPanel token={token} lang={lang} data={data} />}
      settings={<SettingsPanel token={token} lang={lang} data={data} confirm={confirm} />}
    />
  );
}
