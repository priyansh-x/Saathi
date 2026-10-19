import Link from "next/link";
import type { Metadata } from "next";
import { titled } from "@/lib/page-title";
import { EmptyState, ExpiredLink, FamilyFrame, PageTitle } from "@/components/family/chrome";
import { alertQuoteLine, alertTitle, severityChip, sortAlerts, statusPill } from "@/lib/alerts";
import { loadFamily, readLang } from "@/lib/family-load";
import { messages } from "@/lib/i18n/messages";
import { formatFriendlyTime } from "@/lib/time";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  return titled("Alerts · Saathi", "अलर्ट · साथी", (await searchParams).lang);
}

export default async function AlertsPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { token } = await params;
  const lang = readLang((await searchParams).lang);
  const data = await loadFamily(token);
  if (!data) return <ExpiredLink />;
  const t = messages[lang];
  const list = sortAlerts(data.allAlerts);

  return (
    <FamilyFrame
      token={token}
      lang={lang}
      example={data.parent.is_example}
      alerts={data.actAlerts}
      active="alerts"
      updatedAt={data.actAlerts[0]?.created_at}
      addressTerm={data.parent.address_term}
    >
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
                <Link
                  href={`/d/${token}/alerts/${alert.id}?lang=${lang}&from=alerts`}
                  className="card block px-4 py-3"
                >
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
    </FamilyFrame>
  );
}
