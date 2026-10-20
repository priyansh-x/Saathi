"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/family/chrome";
import { clearDeskToken, loadDeskToken, saveDeskToken } from "@/lib/storage";
import type { Lang } from "@/lib/i18n/messages";

/** Opens the last family desk when the PWA starts on / or /onboard. */
export function ResumeDesk({ lang, children }: { lang: Lang; children?: ReactNode }) {
  const router = useRouter();
  const [going, setGoing] = useState(false);

  useLayoutEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("signedout")) {
      clearDeskToken();
      return;
    }
    const token = loadDeskToken();
    if (token) {
      setGoing(true);
      router.replace(`/d/${token}?lang=${lang}`);
      return;
    }
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { deskToken?: string } | null) => {
        if (cancelled || !body?.deskToken) return;
        saveDeskToken(body.deskToken);
        setGoing(true);
        router.replace(`/d/${body.deskToken}?lang=${lang}`);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [lang, router]);

  if (going) return <LoadingState lang={lang} />;
  return children ?? null;
}
