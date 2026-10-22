"use client";

import { ErrorState } from "@/components/family/error-state";

export default function FamilyError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const lang =
    (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("lang") === "hi") ||
    (typeof document !== "undefined" && document.documentElement.lang === "hi")
      ? "hi"
      : "en";
  return <ErrorState lang={lang} onRetry={reset} />;
}
