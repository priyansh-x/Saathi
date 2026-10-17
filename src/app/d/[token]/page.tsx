import Link from "next/link";
import { FamilyFrame } from "@/components/family/chrome";
import { attemptsFor } from "@/lib/db/queries";
import { loadFamily, readLang } from "@/lib/family-load";
import { messages } from "@/lib/i18n/messages";
import { statusClasses, statusLabel } from "@/lib/status";
import { formatIstTime, formatWhen } from "@/lib/time";

export default async function TodayPage({
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
  const attempts = data.call ? await attemptsFor(data.call.id) : [];
  const tel = data.parent.phone.replace(/\s/g, "");

  return (
    <FamilyFrame
      token={token}
      lang={lang}
      example={data.parent.is_example}
      alerts={data.actAlerts}
      active="today"
    >
      <section className={`rounded-2xl px-4 py-4 ${statusClasses(data.status)}`}>
        <p className="tabular text-sm opacity-80">{formatIstTime(data.parent.call_time)}</p>
        <h1 className="mt-1 text-2xl font-semibold">{statusLabel(data.status, lang)}</h1>
        <p className="mt-2 text-sm">
          {data.call?.status === "completed"
            ? lang === "hi"
              ? `${data.parent.first_name} से बात हुई।`
              : `Saathi spoke with ${data.parent.first_name}.`
            : data.call?.status === "missed"
              ? t.missed
              : t.emptyToday}
        </p>
      </section>

      <ul className="mt-5 space-y-3">
        <li className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {data.call?.status === "completed" ? t.answered : data.call ? t.missed : t.notYet}
          </p>
          <p className="tabular mt-1">{formatIstTime(data.parent.call_time)}</p>
        </li>
        {attempts.length > 1 ? (
          <li className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="text-sm text-muted-foreground">{t.ladder}</p>
            <ol className="mt-2 space-y-1 text-sm">
              {attempts.map((a) => (
                <li key={a.id} className="tabular">
                  {a.offset_min === 0 ? "T" : `+${a.offset_min}`} · {formatWhen(a.attempted_at)} · {a.result}
                  {a.result === "escalated" ? ` · ${t.neighbourAsked}` : ""}
                </li>
              ))}
            </ol>
          </li>
        ) : null}
        {data.doses.map((dose) => (
          <li key={dose.medicine_id || dose.id} className="rounded-2xl border border-border bg-card px-4 py-3">
            <p>
              {dose.name} {dose.dose}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {dose.status === "taken"
                ? `${t.taken} ✓`
                : dose.status === "not_taken"
                  ? `${t.notTaken} –`
                  : dose.status === "not_sure"
                    ? `${t.notSure} ?`
                    : `${t.notAsked} ·`}
            </p>
          </li>
        ))}
        {data.call?.mood_quote ? (
          <li className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="font-devanagari text-lg leading-[1.6]">“{data.call.mood_quote}”</p>
            <p className="mt-2 text-sm text-muted-foreground">{t.moodCaption}</p>
          </li>
        ) : null}
      </ul>

      {data.parent.paused ? (
        <p className="mt-5 rounded-2xl bg-amber-soft px-4 py-3 text-amber-ink">{t.paused}</p>
      ) : null}

      <a
        href={`tel:${tel}`}
        className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base text-white"
      >
        {t.callMaa} · {data.parent.phone}
      </a>
      {data.call ? (
        <Link
          href={`/d/${token}/calls/${data.call.id}?lang=${lang}`}
          className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border"
        >
          {lang === "hi" ? "कॉल देखें" : "Call detail"}
        </Link>
      ) : null}
    </FamilyFrame>
  );
}
