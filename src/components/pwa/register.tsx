"use client";

import { useEffect, useState } from "react";
import { Share, SquarePlus } from "lucide-react";
import { isInAppBrowser, isIosLike } from "@/lib/pwa-install";
import type { Lang } from "@/lib/i18n/messages";
import { messages } from "@/lib/i18n/messages";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function AddToHome({ lang }: { lang: Lang }) {
  const t = messages[lang];
  const [mode, setMode] = useState<"hidden" | "native" | "ios" | "inapp" | "hint">("hint");
  const [promptEvent, setPromptEvent] = useState<{ prompt: () => Promise<void> } | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const next = isStandalone()
      ? "hidden"
      : isInAppBrowser(ua)
        ? "inapp"
        : isIosLike(ua, navigator.maxTouchPoints)
          ? "ios"
          : "hint";
    // Standalone / UA cannot be known during SSR without a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- detect install surface after mount
    setMode(next);
    if (next === "hidden") return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      const ce = event as Event & { prompt: () => Promise<void> };
      setPromptEvent({ prompt: () => ce.prompt() });
      setMode("native");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (mode === "hidden") return null;

  if (mode === "native" && promptEvent) {
    return (
      <div className="card mt-4 space-y-2 px-4 py-4">
        <p className="font-semibold">{t.addToHome}</p>
        <p className="text-sm text-muted-foreground">{t.addToHomeNativeHint}</p>
        <button type="button" className="btn-primary" onClick={() => void promptEvent.prompt()}>
          {t.addToHome}
        </button>
      </div>
    );
  }

  if (mode === "inapp") {
    return (
      <div className="card mt-4 space-y-2 px-4 py-4">
        <p className="font-semibold">{t.addToHome}</p>
        <p className="text-sm text-muted-foreground">{t.addToHomeOpenSafari}</p>
      </div>
    );
  }

  if (mode === "ios") {
    return (
      <div className="card mt-4 space-y-3 px-4 py-4">
        <p className="font-semibold">{t.addToHome}</p>
        <p className="text-sm text-muted-foreground">{t.addToHomeIosIntro}</p>
        <ol className="space-y-2 text-sm">
          <li className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-deep">
              <Share className="size-4" aria-hidden />
            </span>
            <span className="pt-1">{t.addToHomeIosShare}</span>
          </li>
          <li className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-deep">
              <SquarePlus className="size-4" aria-hidden />
            </span>
            <span className="pt-1">{t.addToHomeIosAdd}</span>
          </li>
        </ol>
      </div>
    );
  }

  return (
    <div className="card mt-4 space-y-2 px-4 py-4">
      <p className="font-semibold">{t.addToHome}</p>
      <p className="text-sm text-muted-foreground">{t.addToHomeHint}</p>
    </div>
  );
}
