import Link from "next/link";
import { FamilyFrame } from "@/components/family/chrome";
import { historyDays } from "@/lib/db/queries";
import { loadFamily, readLang } from "@/lib/family-load";
import { messages } from "@/lib/i18n/messages";
import { istDayOffset } from "@/lib/time";

export default async function HistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string; days?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const lang = readLang(sp.lang);
  const days = sp.days === "7" ? 7 : 30;
  const data = await loadFamily(token);
  const hist = await historyDays(data.parent.id, 30);
  const t = messages[lang];
  const keys = Array.from({ length: days }, (_, i) => istDayOffset(-(days - 1 - i)));

  return (
    <FamilyFrame
      token={token}
      lang={lang}
      example={data.parent.is_example}
      alerts={data.actAlerts}
      active="history"
    >
      <div className="flex gap-2">
        <Link
          href={`?lang=${lang}&days=7`}
          className={`inline-flex h-11 min-h-11 items-center rounded-2xl px-4 ${days === 7 ? "bg-primary text-white" : "border border-border"}`}
        >
          {t.days7}
        </Link>
        <Link
          href={`?lang=${lang}&days=30`}
          className={`inline-flex h-11 min-h-11 items-center rounded-2xl px-4 ${days === 30 ? "bg-primary text-white" : "border border-border"}`}
        >
          {t.days30}
        </Link>
      </div>
      {hist.calls.length === 0 ? (
        <p className="mt-8 text-muted-foreground">{t.emptyHistory}</p>
      ) : (
        <ol className="mt-5 grid grid-cols-7 gap-2">
          {keys.map((day) => {
            const call = hist.calls.find((c) => c.started_at.startsWith(day));
            const med = hist.doses.find((d) => d.schedule_date === day && d.medicine_id === "med_amlo");
            const label = `${day}, call ${call?.status ?? "none"}, meds ${med?.status ?? "not_asked"}, mood ${call?.mood_quote ?? "none"}`;
            return (
              <li key={day}>
                {call ? (
                  <Link
                    href={`/d/${token}/calls/${call.id}?lang=${lang}`}
                    aria-label={label}
                    className="flex h-14 min-h-11 flex-col items-center justify-center rounded-xl border border-border bg-card text-[10px]"
                  >
                    <span className="tabular">{day.slice(8)}</span>
                    <span aria-hidden>
                      {call.status === "completed" ? "●" : "○"} {med?.status === "taken" ? "●" : "○"}
                    </span>
                  </Link>
                ) : (
                  <span
                    aria-label={`${day}, no call`}
                    className="flex h-14 min-h-11 flex-col items-center justify-center rounded-xl border border-dashed border-border text-[10px] text-muted-foreground"
                  >
                    <span className="tabular">{day.slice(8)}</span>
                    <span aria-hidden>·</span>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <p className="mt-6 text-sm text-muted-foreground">{t.moodCaption}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {keys.map((day) => {
          const call = hist.calls.find((c) => c.started_at.startsWith(day));
          const tone = !call
            ? "bg-muted"
            : call.mood_quote?.toLowerCase().includes("dard") || call.mood_quote?.toLowerCase().includes("phisal")
              ? "bg-alert"
              : call.status === "missed"
                ? "bg-amber-line"
                : "bg-good";
          return (
            <span
              key={`m-${day}`}
              aria-label={`${day} mood`}
              className={`size-2.5 rounded-full ${tone}`}
            />
          );
        })}
      </div>
    </FamilyFrame>
  );
}
