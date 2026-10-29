"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { enableDeskPush, deskPushState } from "@/components/pwa/desk-push";
import { applyDeskUi, readDeskUi, writeDeskUi, type DeskUi } from "@/lib/desk-ui";
import { messages, type Lang } from "@/lib/i18n/messages";

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
  const [mounted, setMounted] = useState(false);
  const [prefs, setPrefs] = useState<DeskUi>({ density: "comfortable", look: "warm", appearance: "light" });
  const [push, setPush] = useState<"default" | "granted" | "denied" | "unsupported">("default");

  useEffect(() => {
    setMounted(true);
    const next = readDeskUi();
    setPrefs(next);
    applyDeskUi(next);
    void deskPushState().then(setPush);
  }, []);

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
      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-end justify-center pb-20 sm:items-center sm:pb-0" role="presentation">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label={t.cancel} onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-labelledby={titleId}
            className="relative z-10 mb-0 w-full max-w-[480px] max-h-[min(88dvh,40rem)] overflow-y-auto rounded-t-[28px] bg-card px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-float)] sm:mb-8 sm:rounded-[28px]"
          >
            <p id={titleId} className="text-[19px] font-semibold">
              {parentName}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t.profileHint}</p>
            {example ? <p className="mt-2 text-xs font-semibold tracking-wide text-amber-ink">{t.example}</p> : null}

            <p className="mt-5 text-xs font-semibold tracking-wide text-ink-3 uppercase">{t.profileSpacing}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`h-11 rounded-full border text-sm ${prefs.density === "comfortable" ? "border-brand bg-brand-soft font-semibold" : "border-border"}`}
                onClick={() => patch({ density: "comfortable" })}
              >
                {t.displayComfortable}
              </button>
              <button
                type="button"
                className={`h-11 rounded-full border text-sm ${prefs.density === "compact" ? "border-brand bg-brand-soft font-semibold" : "border-border"}`}
                onClick={() => patch({ density: "compact" })}
              >
                {t.displayCompact}
              </button>
            </div>

            <p className="mt-4 text-xs font-semibold tracking-wide text-ink-3 uppercase">{t.profileAppearance}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`h-11 rounded-full border text-sm ${prefs.appearance === "light" ? "border-brand bg-brand-soft font-semibold" : "border-border"}`}
                onClick={() => patch({ appearance: "light" })}
              >
                {t.appearanceLight}
              </button>
              <button
                type="button"
                className={`h-11 rounded-full border text-sm ${prefs.appearance === "dark" ? "border-brand bg-brand-soft font-semibold" : "border-border"}`}
                onClick={() => patch({ appearance: "dark" })}
              >
                {t.appearanceDark}
              </button>
            </div>

            <p className="mt-4 text-xs font-semibold tracking-wide text-ink-3 uppercase">{t.profileLook}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`h-11 rounded-full border text-sm ${prefs.look === "warm" ? "border-brand bg-brand-soft font-semibold" : "border-border"}`}
                onClick={() => patch({ look: "warm" })}
              >
                {t.lookWarm}
              </button>
              <button
                type="button"
                className={`h-11 rounded-full border text-sm ${prefs.look === "calm" ? "border-brand bg-brand-soft font-semibold" : "border-border"}`}
                onClick={() => patch({ look: "calm" })}
              >
                {t.lookCalm}
              </button>
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

            <button type="button" className="btn-secondary mt-5 w-full" onClick={() => setOpen(false)}>
              {t.doneProfile}
            </button>
          </div>
        </div>,
            document.body,
          )
        : null}
    </>
  );
}
