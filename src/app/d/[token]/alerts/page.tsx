import Link from "next/link";
import { AlertTriangle, Check, Minus } from "lucide-react";
import { ExpiredLink, FamilyFrame } from "@/components/family/chrome";
import { alertQuoteLine, alertTitle, severityChip, sortAlerts, statusPill } from "@/lib/alerts";
import { loadFamily, readLang } from "@/lib/family-load";
import { messages } from "@/lib/i18n/messages";
import { formatFriendlyTime } from "@/lib/time";

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
    >
      {list.length === 0 ? (
        <p className="text-muted-foreground">{t.emptyAlerts}</p>
      ) : (
        <ul className="space-y-3">
          {list.map((alert) => {
            const sev = severityChip(alert, lang);
            const pill = statusPill(alert, lang);
            const quote = alertQuoteLine(alert);
            return (
              <li key={alert.id}>
                <Link
                  href={`/d/${token}/alerts/${alert.id}?lang=${lang}`}
                  className="block rounded-2xl border border-border bg-card px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {sev ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs ${
                          sev.tone === "act" ? "bg-alert-soft text-alert" : "bg-amber-soft text-amber-ink"
                        }`}
                      >
                        <AlertTriangle className="size-3" aria-hidden />
                        {sev.label}
                      </span>
                    ) : null}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                        pill.tone === "open"
                          ? "border border-alert text-alert"
                          : pill.tone === "look"
                            ? "bg-amber-soft text-amber-ink"
                            : pill.tone === "good"
                              ? "bg-good-soft text-good"
                              : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {pill.tone === "good" ? <Check className="size-3" aria-hidden /> : null}
                      {pill.tone === "neutral" ? <Minus className="size-3" aria-hidden /> : null}
                      {pill.label}
                    </span>
                  </div>
                  <p className="mt-2 font-medium capitalize">{alertTitle(alert, lang)}</p>
                  {quote ? <p className="font-devanagari mt-1 text-sm">“{quote}”</p> : null}
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
