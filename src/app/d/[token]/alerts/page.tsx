import Link from "next/link";
import { FamilyFrame } from "@/components/family/chrome";
import { loadFamily, readLang } from "@/lib/family-load";
import { messages } from "@/lib/i18n/messages";
import { statusClasses, statusLabel } from "@/lib/status";
import { formatWhen } from "@/lib/time";

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
  const t = messages[lang];

  return (
    <FamilyFrame
      token={token}
      lang={lang}
      example={data.parent.is_example}
      alerts={data.actAlerts}
      active="alerts"
    >
      {data.allAlerts.length === 0 ? (
        <p className="text-muted-foreground">{t.emptyAlerts}</p>
      ) : (
        <ul className="space-y-3">
          {data.allAlerts.map((alert) => (
            <li key={alert.id}>
              <Link
                href={`/d/${token}/alerts/${alert.id}?lang=${lang}`}
                className="block rounded-2xl border border-border bg-card px-4 py-3"
              >
                <span className={`inline-flex rounded-lg px-2 py-1 text-xs ${statusClasses(alert.level)}`}>
                  {statusLabel(alert.level, lang)}
                </span>
                <p className="mt-2 font-devanagari">“{alert.quote}”</p>
                <p className="tabular mt-1 text-sm text-muted-foreground">{formatWhen(alert.created_at)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </FamilyFrame>
  );
}
