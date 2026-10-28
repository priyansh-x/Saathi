"use client";

import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import { enableDeskPush, deskPushState } from "@/components/pwa/desk-push";
import { applyDeskUi, DESK_UI_DEFAULTS, readDeskUi, writeDeskUi, type DeskUi } from "@/lib/desk-ui";
import { qs } from "@/lib/history";
import { messages, type Lang } from "@/lib/i18n/messages";

function Choice({
  pressed,
  children,
  onClick,
}: {
  pressed: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`min-h-11 rounded-full border px-2 text-sm ${
        pressed ? "border-brand bg-brand-soft font-semibold" : "border-border bg-background"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function ProfileSheet({
  token,
  lang,
  parentName,
  example,
  children,
}: {
  token?: string;
  lang: Lang;
  parentName: string;
  example?: boolean;
  children: ReactNode;
}) {
  const t = messages[lang];
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<DeskUi>(DESK_UI_DEFAULTS);
  const [push, setPush] = useState<"default" | "granted" | "denied" | "unsupported">("default");

  useEffect(() => {
    const next = readDeskUi();
    setPrefs(next);
    applyDeskUi(next);
    void deskPushState().then(setPush);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function patch(partial: Partial<DeskUi>) {
    const next = { ...prefs, ...partial };
    setPrefs(next);
    writeDeskUi(next);
  }

  async function onNotify() {
    if (!token) return;
    const result = await enableDeskPush(token);
    setPush(result.ok ? "granted" : result.reason === "denied" ? "denied" : "unsupported");
  }

  const settingsHref = token ? `/d/${token}/settings${qs({ lang })}` : null;
  const walkHref = `/demo${qs({ lang })}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full ring-2 ring-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={t.profileOpen}
      >
        {children}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label={t.cancel} onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-labelledby={titleId}
            className="relative z-10 mb-0 flex max-h-[min(92dvh,720px)] w-full max-w-[480px] flex-col overflow-hidden rounded-t-[28px] bg-card shadow-[var(--shadow-float)] sm:mb-8 sm:rounded-[28px]"
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-3">
              <p id={titleId} className="text-[19px] font-semibold">
                {parentName}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t.profileHint}</p>
              {example ? <p className="mt-2 text-xs font-semibold tracking-wide text-amber-ink">{t.profileExampleNote}</p> : null}

              <p className="mt-5 text-xs font-semibold tracking-wide text-ink-3 uppercase">{t.profileTheme}</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Choice pressed={prefs.theme === "light"} onClick={() => patch({ theme: "light" })}>
                  {t.themeLight}
                </Choice>
                <Choice pressed={prefs.theme === "dark"} onClick={() => patch({ theme: "dark" })}>
                  {t.themeDark}
                </Choice>
                <Choice pressed={prefs.theme === "system"} onClick={() => patch({ theme: "system" })}>
                  {t.themeSystem}
                </Choice>
              </div>

              <p className="mt-4 text-xs font-semibold tracking-wide text-ink-3 uppercase">{t.profileTypeSize}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Choice pressed={prefs.typeSize === "regular"} onClick={() => patch({ typeSize: "regular" })}>
                  {t.typeRegular}
                </Choice>
                <Choice pressed={prefs.typeSize === "large"} onClick={() => patch({ typeSize: "large" })}>
                  {t.typeLarge}
                </Choice>
              </div>

              <p className="mt-4 text-xs font-semibold tracking-wide text-ink-3 uppercase">{t.profileSpacing}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Choice pressed={prefs.density === "comfortable"} onClick={() => patch({ density: "comfortable" })}>
                  {t.displayComfortable}
                </Choice>
                <Choice pressed={prefs.density === "compact"} onClick={() => patch({ density: "compact" })}>
                  {t.displayCompact}
                </Choice>
              </div>

              <p className="mt-4 text-xs font-semibold tracking-wide text-ink-3 uppercase">{t.profileLook}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Choice pressed={prefs.look === "warm"} onClick={() => patch({ look: "warm" })}>
                  {t.lookWarm}
                </Choice>
                <Choice pressed={prefs.look === "calm"} onClick={() => patch({ look: "calm" })}>
                  {t.lookCalm}
                </Choice>
              </div>

              <p className="mt-4 text-xs font-semibold tracking-wide text-ink-3 uppercase">{t.profileMotion}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Choice pressed={prefs.motion === "full"} onClick={() => patch({ motion: "full" })}>
                  {t.motionFull}
                </Choice>
                <Choice pressed={prefs.motion === "reduce"} onClick={() => patch({ motion: "reduce" })}>
                  {t.motionReduce}
                </Choice>
              </div>

              {token ? (
                <div className="mt-5 rounded-2xl border border-border px-4 py-3">
                  <p className="font-medium">{t.notifyThisPhone}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {push === "granted" ? t.notifyThisPhoneOn : push === "denied" ? t.notifyDenied : t.notifyThisPhoneOff}
                  </p>
                  {push !== "granted" ? (
                    <button type="button" className="btn-primary mt-3" onClick={() => void onNotify()}>
                      {t.notifyEnable}
                    </button>
                  ) : null}
                </div>
              ) : null}

              <p className="mt-6 text-xs font-semibold tracking-wide text-ink-3 uppercase">{t.profileGuideTitle}</p>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-[15px] leading-snug text-foreground">
                <li>{t.profileGuide1}</li>
                <li>{t.profileGuide2}</li>
                <li>{t.profileGuide3}</li>
                <li>{t.profileGuide4}</li>
              </ol>
              <div className="mt-4 space-y-2">
                <Link href={walkHref} className="btn-secondary" onClick={() => setOpen(false)}>
                  {t.profileWalk}
                </Link>
                {settingsHref ? (
                  <Link href={settingsHref} className="btn-secondary" onClick={() => setOpen(false)}>
                    {t.profileSettingsLink}
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="border-t border-border px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button type="button" className="btn-primary w-full" onClick={() => setOpen(false)}>
                {t.doneProfile}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
