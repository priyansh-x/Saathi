"use client";

import { useEffect, useState } from "react";
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
  const [promptEvent, setPromptEvent] = useState<{ prompt: () => Promise<void> } | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalone()) {
      setHidden(true);
      return;
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      const ce = event as Event & { prompt: () => Promise<void> };
      setPromptEvent({ prompt: () => ce.prompt() });
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden || !promptEvent) return null;
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
