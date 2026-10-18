"use client";

import { ErrorState } from "@/components/family/chrome";

export default function FamilyError({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const lang = typeof document !== "undefined" && document.documentElement.lang === "hi" ? "hi" : "en";
  return <ErrorState lang={lang} onRetry={retry} />;
}
