"use client";

import { ErrorState } from "@/components/family/error-state";

export default function DemoError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const lang = typeof document !== "undefined" && document.documentElement.lang === "hi" ? "hi" : "en";
  return <ErrorState lang={lang} onRetry={reset} />;
}
