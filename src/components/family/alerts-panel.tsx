import Link from "next/link";
import { AlertTriangle, Check, ChevronRight, Eye, Minus } from "lucide-react";
import { EmptyState, PageTitle } from "@/components/family/chrome";
import { ALERT_PILL_TONE, alertLife, alertQuoteLine, alertTitle, sortAlerts, statusPill } from "@/lib/alerts";
import { clientSafe } from "@/lib/client-safe";
import { alertsFor } from "@/lib/db/queries";
import { messages, type Lang } from "@/lib/i18n/messages";
import { formatFriendlyTime } from "@/lib/time";

const LIFE_ICON = {
  open: { Icon: AlertTriangle, tone: "bg-alert-soft text-alert" },
  going: { Icon: Eye, tone: "bg-amber-soft text-amber-ink" },
  ok: { Icon: Check, tone: "bg-good-soft text-good" },
  false: { Icon: Minus, tone: "bg-sunk text-muted-foreground" },
} as const;

export async function AlertsPanel({ token, lang, parentId }: { token: string; lang: Lang; parentId: string }) {
  const t = messages[lang];
  const list = sortAlerts(clientSafe(await alertsFor(parentId)));

  return (
    <>
      <PageTitle>{t.alerts}</PageTitle>
      {list.length === 0 ? (
        <EmptyState title={t.emptyAlerts} body={t.emptyAlertsBody} />
      ) : (
        <ul className="list-group">
          {list.map((alert) => {
            const pill = statusPill(alert, lang);
            const quote = alertQuoteLine(alert);
            const { Icon, tone } = LIFE_ICON[alertLife(alert)];
            return (
              <li key={alert.id}>
                <Link
                  href={`/d/${token}/alerts/${alert.id}?lang=${lang}&from=alerts`}
                  className="list-row items-start active:bg-sunk"
                >
                  <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full ${tone}`}>
                    <Icon className="size-[18px]" strokeWidth={2.25} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] leading-snug font-medium first-letter:uppercase">{alertTitle(alert, lang)}</span>
                    <span className="tabular mt-0.5 block text-[13px] text-ink-3">{formatFriendlyTime(alert.created_at, lang)}</span>
                    {quote ? (
                      <span className="font-devanagari mt-1.5 line-clamp-2 block text-[14px] leading-snug text-muted-foreground">
                        “{quote}”
                      </span>
                    ) : null}
                    <span className={`pill mt-2 ${ALERT_PILL_TONE[pill.tone]}`}>{pill.label}</span>
                  </span>
                  <ChevronRight className="mt-2 size-5 shrink-0 text-ink-3" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
