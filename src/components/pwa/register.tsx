"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n/messages";
import { messages } from "@/lib/i18n/messages";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }, []);
  return null;
}

export function AddToHome({ lang }: { lang: Lang }) {
  const t = messages[lang];
  const [promptEvent, setPromptEvent] = useState<{ prompt: () => Promise<void> } | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      const ce = event as Event & { prompt: () => Promise<void> };
      setPromptEvent({ prompt: () => ce.prompt() });
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden) return null;
  if (!promptEvent) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        {t.addToHomeHint}
      </p>
    );
  }
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
      <button
        type="button"
        className="underline-offset-2 hover:underline"
        onClick={() => {
          void promptEvent.prompt();
        }}
      >
        {t.addToHome}
      </button>
      <button type="button" className="text-muted-foreground underline-offset-2 hover:underline" onClick={() => setHidden(true)}>
        {t.cancel}
      </button>
    </div>
  );
}
