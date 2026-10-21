"use client";

import { useEffect, useState } from "react";
import { enableDeskPush, subscribeDeskPush, deskPushState } from "@/components/pwa/desk-push";
import { messages, type Lang } from "@/lib/i18n/messages";

export function DeskNotifyPrompt({ token, lang }: { token: string; lang: Lang }) {
  const t = messages[lang];
  const [push, setPush] = useState<"default" | "granted" | "denied" | "unsupported" | "hidden">("hidden");

  useEffect(() => {
    void deskPushState().then(async (state) => {
      if (state === "granted") {
        await subscribeDeskPush(token);
        setPush("hidden");
        return;
      }
      setPush(state);
    });
  }, [token]);

  if (push === "hidden" || push === "granted" || push === "unsupported") return null;

  async function onEnable() {
    const result = await enableDeskPush(token);
    setPush(result.ok ? "hidden" : result.reason === "denied" ? "denied" : "unsupported");
  }

  return (
    <div className="mx-4 mb-3 rounded-[22px] border border-border bg-card px-4 py-3">
      <p className="font-medium">{t.notifyThisPhone}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {push === "denied" ? t.notifyDenied : t.notifyThisPhoneOff}
      </p>
      {push !== "denied" ? (
        <button type="button" className="btn-primary mt-3" onClick={() => void onEnable()}>
          {t.notifyEnable}
        </button>
      ) : null}
    </div>
  );
}
