"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n/messages";
import { messages } from "@/lib/i18n/messages";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" });
    }
    const match = window.location.pathname.match(/^\/d\/([^/]+)/);
    if (match) {
      void fetch(`/api/d/${match[1]}/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: `mock://${window.location.host}/${match[1]}` }),
      });
    }
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
      <p className="mt-4 text-[14px] leading-6 text-muted-foreground">
        {t.addToHomeHint}
      </p>
    );
  }
  return (
    <div className="mt-4 space-y-2">
      <button
        type="button"
        className="btn-secondary"
        onClick={() => {
          void promptEvent.prompt();
        }}
      >
        {t.addToHome}
      </button>
      <button type="button" className="btn-quiet w-full text-muted-foreground" onClick={() => setHidden(true)}>
        {t.cancel}
      </button>
    </div>
  );
}
