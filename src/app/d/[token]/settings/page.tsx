import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { InviteForm } from "@/components/family/invite-form";
import { SettingsForm } from "@/components/family/settings-form";
import { ExpiredLink, FamilyFrame, PageTitle } from "@/components/family/chrome";
import { AddToHome } from "@/components/pwa/register";
import { CachedAction, SignOutButton } from "@/components/pwa/clear-cache";
import { decodeSession, SESSION_COOKIE } from "@/lib/auth/session";
import { isMockBolna, isMockWhatsapp, retentionSummaryDays, retentionTranscriptDays } from "@/lib/config";
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
      <FamilyFrame token={token} lang={lang} example={data.parent.is_example} alerts={data.actAlerts} active="settings" addressTerm={data.parent.address_term}>
        <PageTitle>{t.deleteConfirmTitle}</PageTitle>
        <p className="text-muted-foreground">{t.deleteConfirmBody}</p>
        <div className="mt-6">
          <CachedAction action={wipe} className="btn-primary bg-alert">
            {t.deleteConfirmYes}
          </CachedAction>
        </div>
        <Link href={`/d/${token}/settings?lang=${lang}`} className="btn-secondary mt-3">
          {t.cancel}
        </Link>
      </FamilyFrame>
    );
  }

  return (
    <FamilyFrame token={token} lang={lang} example={data.parent.is_example} alerts={data.actAlerts} active="settings" addressTerm={data.parent.address_term}>
      <PageTitle
        sub={`${t.saathiCallsHer} ${data.parent.address_term || data.parent.first_name} · ${langs || t.languageWords}${process.env.VIEWER_TZ ? ` · ${formatIstTime(data.parent.call_time)} ${t.yourTime}` : ` · ${formatIstTime(data.parent.call_time)}`}`}
      >
        {t.settings}
      </PageTitle>

      <div className="mt-1">
        <SettingsForm
          token={token}
          lang={lang}
          callTime={data.parent.call_time}
          languages={data.parent.languages}
          neighbourName={data.neighbour?.full_name || ""}
          neighbourPhone={data.neighbour?.phone || ""}
          medicines={timedMeds}
        />
      </div>

      <section className="card mt-6 space-y-3 px-4 py-4">
        <h2 className="font-semibold">{t.familySection}</h2>
        <ul className="list-group">
          {members.map((member) => (
            <li key={member.id} className="list-row">
              <span className="grid size-10 place-items-center rounded-full bg-brand-soft font-serif text-brand-deep">
                {(member.full_name.trim()[0] || "स").toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 text-sm">
                <span className="block font-medium">{member.full_name}</span>
                <span className="text-muted-foreground">
                  {member.is_owner ? t.setsUpFamily : ""}
                  {member.id === data.child?.id ? ` · ${optLabel(childYes?.granted, lang)}` : ""}
                </span>
              </span>
            </li>
          ))}
        </ul>
        {data.neighbour ? (
          <div className="flex items-center gap-3">
            {data.parent.is_example ? (
              <Image
                src="/images/neighbour-knock.jpg"
                alt=""
                width={72}
                height={72}
                className="size-[72px] rounded-2xl object-cover"
              />
            ) : null}
            <p className="text-sm text-muted-foreground">
              {data.neighbour.full_name} · {optLabel(neighbourYes?.granted ?? (data.parent.is_example ? true : undefined), lang)}
            </p>
          </div>
        ) : null}
        {ownerDelete ? <InviteForm token={token} label={t.inviteMember} hint={t.inviteHint} /> : null}
      </section>

      <section className="card mt-6 px-4 py-4">
        <h2 className="font-semibold">{t.pauseLabel}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{data.parent.paused ? t.paused : t.callingOn}</p>
        <form action={togglePause} className="mt-3">
          <button type="submit" className="btn-secondary">
            {data.parent.paused ? t.pauseOff : t.pauseOn}
          </button>
        </form>
      </section>

      <section className="card mt-6 space-y-3 px-4 py-4">
        <h2 className="font-semibold">{t.privacySection}</h2>
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
        <p className="text-sm text-muted-foreground">
          {t.retentionPolicy
            .replace("{transcript}", String(retentionTranscriptDays()))
            .replace("{summary}", String(retentionSummaryDays()))}
        </p>
        {ownerDelete ? (
          <Link
            href={`/d/${token}/settings?lang=${lang}&confirm=delete`}
            className="btn-secondary border-alert text-alert"
          >
            {t.deleteData}
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">{t.onlyOwnerDelete}</p>
        )}
      </section>

      <section className="card mt-6 px-4 py-4">
        <h2 className="font-semibold">{t.aboutSection}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.aboutBody}</p>
        <AddToHome lang={lang} />
        <SignOutButton label={t.signOut} />
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
