"use client";

import { ErrorState } from "@/components/family/chrome";

export default function FamilyError({ retry }: { error: unknown; retry: () => void }) {
  return <ErrorState onRetry={retry} />;
}
