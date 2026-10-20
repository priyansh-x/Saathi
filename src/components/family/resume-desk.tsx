"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadDeskToken } from "@/lib/storage";
import type { Lang } from "@/lib/i18n/messages";

/** Opens the last family desk when the PWA starts on / or /onboard. */
export function ResumeDesk({ lang }: { lang: Lang }) {
  const router = useRouter();
  useEffect(() => {
    const token = loadDeskToken();
    if (!token) return;
    router.replace(`/d/${token}?lang=${lang}`);
  }, [lang, router]);
  return null;
}
