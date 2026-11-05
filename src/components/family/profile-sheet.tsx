"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Bell, BellOff, Check, ChevronDown, ChevronRight, Monitor, Moon, PlayCircle, Settings2, Sun, X } from "lucide-react";
import { createPortal } from "react-dom";
import { enableDeskPush, deskPushState } from "@/components/pwa/desk-push";
import {
  applyDeskUi,
  DESK_UI_DEFAULTS,
  profileDoneControl,
  profileSheetHost,
  readDeskUi,
  writeDeskUi,
  type DeskUi,
} from "@/lib/desk-ui";
import { qs } from "@/lib/history";
import { messages, type Lang } from "@/lib/i18n/messages";

/** One compact segmented control per display preference, label on the left. */
function PrefRow<T extends string>({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; icon?: ReactNode }[];
  onPick: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3" role="group" aria-label={label}>
      <span className="text-[15px] font-medium">{label}</span>
      <span className="seg seg-sm ml-auto">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={value === opt.value}
            aria-current={value === opt.value ? "page" : undefined}
            onClick={() => onPick(opt.value)}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </span>
    </div>
  );
}

function MenuRow({
  icon,
  title,
  sub,
  href,
  onClick,
  trailing,
}: {
  icon: ReactNode;
  title: string;
  sub?: string;
  href?: string;
  onClick?: () => void;
  trailing?: ReactNode;
}) {
  const body = (
    <>
      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-deep">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        {sub ? <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{sub}</span> : null}
      </span>
      {trailing ?? (href ? <ChevronRight className="size-5 shrink-0 text-ink-3" aria-hidden /> : null)}
    </>
  );
  if (href) {
    return (
      <Link href={href} onClick={onClick} className="list-row min-h-[64px]">
        {body}
      </Link>
    );
  }
  return <div className="list-row min-h-[64px]">{body}</div>;
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<DeskUi>(DESK_UI_DEFAULTS);
  const [push, setPush] = useState<"default" | "granted" | "denied" | "unsupported">("default");

  useEffect(() => {
    const next = readDeskUi();
    applyDeskUi(next);
    // Prefs and push permission live on this device; they are unknown during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setPrefs(next);
    void deskPushState().then(setPush);
  }, []);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
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
  const done = profileDoneControl(prefs.theme);

  function closeSheet() {
    if (done.closes) setOpen(false);
  }

  const sheet = open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
          <button type="button" className="sheet-backdrop absolute inset-0 bg-black/40" aria-label={t.menuClose} onClick={closeSheet} />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="sheet-panel relative z-10 mb-0 flex max-h-[min(90dvh,720px)] w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl bg-background shadow-[var(--shadow-float)] outline-none sm:mb-8 sm:rounded-3xl"
          >
            <div aria-hidden className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border sm:hidden" />
            <div className="flex shrink-0 items-center gap-3 px-5 pt-3 pb-4">
              <span className="pointer-events-none">{children}</span>
              <div className="min-w-0 flex-1">
                <p id={titleId} className="truncate text-[19px] leading-tight font-semibold">
                  {parentName}
                </p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{t.profileOpen}</p>
              </div>
              <button
                type="button"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-sunk text-foreground disabled:opacity-50"
                aria-label={t.menuClose}
                disabled={done.disabled}
                onClick={closeSheet}
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              {example ? (
                <p className="mb-3 rounded-[var(--radius-control)] bg-amber-soft px-3 py-2 text-sm font-medium text-amber-ink">{t.profileExampleNote}</p>
              ) : null}
              <div className="list-group">
                {settingsHref ? (
                  <MenuRow icon={<Settings2 className="size-5" />} title={t.profileSettingsLink} sub={t.menuSettingsSub} href={settingsHref} onClick={closeSheet} />
                ) : null}
                {token ? (
                  <MenuRow
                    icon={push === "granted" ? <Bell className="size-5" /> : <BellOff className="size-5" />}
                    title={t.notifyThisPhone}
                    sub={push === "granted" ? t.notifyThisPhoneOn : push === "denied" ? t.notifyDenied : t.notifyThisPhoneOff}
                    trailing={
                      push === "granted" ? (
                        <span className="pill shrink-0 bg-good-soft text-good">
                          <Check className="size-3.5" aria-hidden />
                          {t.alertsOn}
                        </span>
                      ) : push === "denied" ? null : (
                        <button type="button" className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={() => void onNotify()}>
                          {t.notifyEnable}
                        </button>
                      )
                    }
                  />
                ) : null}
                <MenuRow icon={<PlayCircle className="size-5" />} title={t.profileWalk} sub={t.menuWalkSub} href={walkHref} onClick={closeSheet} />
              </div>

              <p className="section-label mt-6 mb-1 px-1">{t.profileDisplay}</p>
              <p className="mb-2 px-1 text-sm text-muted-foreground">{t.menuDisplaySub}</p>
              <div className="list-group">
                <PrefRow
                  label={t.profileTheme}
                  value={prefs.theme}
                  onPick={(theme) => patch({ theme })}
                  options={[
                    { value: "light", label: t.themeLight, icon: <Sun className="size-4" aria-hidden /> },
                    { value: "dark", label: t.themeDark, icon: <Moon className="size-4" aria-hidden /> },
                    { value: "system", label: t.themeAuto, icon: <Monitor className="size-4" aria-hidden /> },
                  ]}
                />
                <PrefRow
                  label={t.profileTypeSize}
                  value={prefs.typeSize}
                  onPick={(typeSize) => patch({ typeSize })}
                  options={[
                    { value: "regular", label: t.typeRegular },
                    { value: "large", label: t.typeLarge },
                  ]}
                />
                <PrefRow
                  label={t.profileSpacing}
                  value={prefs.density}
                  onPick={(density) => patch({ density })}
                  options={[
                    { value: "comfortable", label: t.displayComfortable },
                    { value: "compact", label: t.displayCompact },
                  ]}
                />
                <PrefRow
                  label={t.profileLook}
                  value={prefs.look}
                  onPick={(look) => patch({ look })}
                  options={[
                    { value: "warm", label: t.lookWarm },
                    { value: "calm", label: t.lookCalm },
                  ]}
                />
                <PrefRow
                  label={t.profileMotion}
                  value={prefs.motion}
                  onPick={(motion) => patch({ motion })}
                  options={[
                    { value: "full", label: t.motionFull },
                    { value: "reduce", label: t.motionReduce },
                  ]}
                />
              </div>

              <details className="group list-group mt-6">
                <summary className="list-row min-h-[56px] cursor-pointer list-none font-medium [&::-webkit-details-marker]:hidden">
                  <span className="flex-1">{t.profileGuideTitle}</span>
                  <ChevronDown className="size-5 text-ink-3 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <ol className="list-decimal space-y-2 px-4 pt-3 pb-4 pl-9 text-[15px] leading-snug text-muted-foreground">
                  <li>{t.profileGuide1}</li>
                  <li>{t.profileGuide2}</li>
                  <li>{t.profileGuide3}</li>
                  <li>{t.profileGuide4}</li>
                </ol>
              </details>
            </div>
          </div>
        </div>
  ) : null;
  const host = profileSheetHost(typeof document === "undefined" ? null : document);

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
      {sheet && host ? createPortal(sheet, host) : sheet}
    </>
  );
}
