import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { InviteForm } from "@/components/family/invite-form";
import { SettingsForm } from "@/components/family/settings-form";
import { ExpiredLink, FamilyFrame } from "@/components/family/chrome";
import { decodeSession, SESSION_COOKIE } from "@/lib/auth/session";
import { isMockBolna, isMockWhatsapp } from "@/lib/config";
import { consentsFor } from "@/lib/consent";
import { deleteFamily } from "@/lib/delete-family";
import { medicinesWithTimes } from "@/lib/db/queries";
import { loadFamily, readLang } from "@/lib/family-load";
import { localeWord, messages } from "@/lib/i18n/messages";
import { canDeleteFamily, childrenFor } from "@/lib/members";
import { actorName, updatePaused } from "@/lib/settings";
import { formatFriendlyTime, formatIstTime } from "@/lib/time";

function optLabel(granted: boolean | undefined, lang: "en" | "hi") {
  const t = messages[lang];
  if (granted === true) return `✓ ${t.optReady}`;
  if (granted === false) return `✕ ${t.optDeclined}`;
  return `⏳ ${t.optWaiting}`;
}

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string; confirm?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const lang = readLang(sp.lang);
  const data = await loadFamily(token);
  if (!data) return <ExpiredLink lang={lang} />;
  const t = messages[lang];
  const parentId = data.parent.id;
  const nextPaused = !data.parent.paused;
  const consents = await consentsFor(parentId);
  const voice = consents.find((c) => c.kind === "parent_voice");
  const childYes = consents.find((c) => c.kind === "child_written");
  const neighbourYes = consents.find((c) => c.kind === "neighbour_whatsapp");
  const langs = data.parent.languages
    .split(",")
    .map((code) => localeWord(code.trim(), lang))
    .join(", ");
  const mockOn = isMockBolna() || isMockWhatsapp();
  const timedMeds = await medicinesWithTimes(parentId);
  const members = await childrenFor(parentId);
  const sessionEmail = decodeSession((await cookies()).get(SESSION_COOKIE)?.value)?.email ?? null;
  const ownerDelete = await canDeleteFamily(parentId, sessionEmail);

  async function togglePause() {
    "use server";
    await updatePaused(parentId, nextPaused, await actorName(parentId));
    redirect(`/d/${token}/settings?lang=${lang}`);
  }

  async function wipe() {
    "use server";
    const email = decodeSession((await cookies()).get(SESSION_COOKIE)?.value)?.email ?? null;
    if (!(await canDeleteFamily(parentId, email))) {
      redirect(`/d/${token}/settings?lang=${lang}`);
      return;
    }
    await deleteFamily(parentId);
    redirect("/");
  }

  if (sp.confirm === "delete") {
    return (
      <FamilyFrame token={token} lang={lang} example={data.parent.is_example} alerts={data.actAlerts} active="settings">
        <h1 className="text-2xl font-semibold">{t.deleteConfirmTitle}</h1>
        <p className="mt-3 text-muted-foreground">{t.deleteConfirmBody}</p>
        <form action={wipe} className="mt-6">
          <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-alert text-white">
            {t.deleteConfirmYes}
          </button>
        </form>
        <Link href={`/d/${token}/settings?lang=${lang}`} className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border">
          {t.cancel}
        </Link>
      </FamilyFrame>
    );
  }

  return (
    <FamilyFrame token={token} lang={lang} example={data.parent.is_example} alerts={data.actAlerts} active="settings">
      <section className="space-y-3">
        <h1 className="text-lg font-semibold">{t.callSection}</h1>
        <p className="tabular">
          {formatIstTime(data.parent.call_time)}
          {process.env.VIEWER_TZ ? ` · ${t.yourTime}` : null}
        </p>
        <p>{t.callDays}</p>
        <p>{langs || t.languageWords}</p>
        <p>
          {t.saathiCallsHer} {data.parent.first_name}
        </p>
        <p className="text-sm text-muted-foreground">{t.settingsHint}</p>
      </section>

      <section className="mt-8">
        <SettingsForm
          token={token}
          lang={lang}
          callTime={data.parent.call_time}
          languages={data.parent.languages}
          neighbourName={data.neighbour?.full_name || ""}
          neighbourPhone={data.neighbour?.phone || ""}
          medicines={timedMeds}
          saveLabel={t.saveChanges}
          nextCallHint={t.settingsHint}
        />
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="text-lg font-semibold">{t.medicinesSection}</h2>
        <p className="text-sm text-muted-foreground">{t.medsDisclaimer}</p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="text-lg font-semibold">{t.familySection}</h2>
        <ul className="space-y-1">
          {members.map((member) => (
            <li key={member.id}>
              {member.full_name}
              {member.is_owner ? " · first child" : ""}
              {member.id === data.child?.id ? ` · ${optLabel(childYes?.granted, lang)}` : ""}
            </li>
          ))}
        </ul>
        <p>
          {data.neighbour?.full_name} ji · {optLabel(neighbourYes?.granted ?? (data.parent.is_example ? true : undefined), lang)}
        </p>
        {ownerDelete ? <InviteForm token={token} /> : null}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t.pauseLabel}</h2>
        <p className="mt-1">{data.parent.paused ? t.paused : t.callingOn}</p>
        <form action={togglePause} className="mt-3">
          <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-white">
            {data.parent.paused ? t.pauseOff : t.pauseOn}
          </button>
        </form>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="text-lg font-semibold">{t.privacySection}</h2>
        <p>
          {data.parent.consent_status === "given"
            ? `${t.firstCallGiven}${data.parent.consent_at ? ` · ${formatFriendlyTime(data.parent.consent_at, lang)}` : ""}`
            : data.parent.consent_status === "declined"
              ? t.firstCallDeclined
              : (data.parent.consent_later_count ?? 0) >= 2
                ? t.firstCallLaterStopped
                : (data.parent.consent_later_count ?? 0) === 1
                  ? t.firstCallLaterRetry
                  : t.firstCallPending}
        </p>
        <p>
          {voice?.granted
            ? `${t.recordingYes} ${formatFriendlyTime(voice.at, lang).replace(/, .+$/, "").replace(/^Today |^आज /, "· ")}`
            : t.recordingNo}
        </p>
        {ownerDelete ? (
          <Link
            href={`/d/${token}/settings?lang=${lang}&confirm=delete`}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-alert text-alert"
          >
            {t.deleteData}
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">Only the first child can delete this family.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t.aboutSection}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.aboutBody}</p>
      </section>

      {mockOn ? (
        <p className="mt-8 text-sm">
          <Link href={`/demo/controls?lang=${lang}`} className="underline-offset-2 hover:underline">
            {t.demoControls}
          </Link>
        </p>
      ) : null}
    </FamilyFrame>
  );
}
