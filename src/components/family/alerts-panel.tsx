import Link from "next/link";
import { EmptyState, PageTitle } from "@/components/family/chrome";
import { alertQuoteLine, alertTitle, severityChip, sortAlerts, statusPill } from "@/lib/alerts";
import type { FamilyDesk } from "@/lib/family-load";
import { messages, type Lang } from "@/lib/i18n/messages";
import { formatFriendlyTime } from "@/lib/time";

export function AlertsPanel({ token, lang, data }: { token: string; lang: Lang; data: FamilyDesk }) {
  const t = messages[lang];
  const list = sortAlerts(data.allAlerts);

  return (
    <>
      <PageTitle>{t.alerts}</PageTitle>
      {list.length === 0 ? (
        <EmptyState title={t.emptyAlerts} body={t.emptyAlertsBody} />
      ) : (
        <ul className="space-y-3">
          {list.map((alert) => {
            const sev = severityChip(alert, lang);
            const pill = statusPill(alert, lang);
            const quote = alertQuoteLine(alert);
            return (
              <li key={alert.id}>
                <Link href={`/d/${token}/alerts/${alert.id}?lang=${lang}&from=alerts`} className="card block px-4 py-3">
                  <p className="font-medium">{alertTitle(alert, lang)}</p>
                  <p className={`mt-1 text-sm ${sev?.tone === "act" || pill.tone === "open" ? "text-alert" : "text-muted-foreground"}`}>
                    {pill.label}
                    {sev ? ` · ${sev.label}` : ""}
                  </p>
                  {quote ? <p className="font-devanagari mt-2 text-sm leading-relaxed">“{quote}”</p> : null}
                  <p className="mt-1 text-sm text-muted-foreground">{formatFriendlyTime(alert.created_at, lang)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
