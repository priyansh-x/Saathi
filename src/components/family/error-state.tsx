"use client";

import { CloudOff } from "lucide-react";
import { messages, type Lang } from "@/lib/i18n/messages";

export function ErrorState({
  lang = "en",
  onRetry,
}: {
  lang?: Lang;
  onRetry?: () => void;
}) {
  return (
    <div className="app-shell-scroll px-6 py-16">
      <span className="grid size-14 place-items-center rounded-full bg-amber-soft text-amber-ink">
        <CloudOff className="size-6" aria-hidden />
      </span>
      <p className="mt-5 text-[19px] font-semibold">{messages[lang].loadError}</p>
      <button type="button" onClick={onRetry} className="btn-primary mt-6">
        {messages[lang].retry}
      </button>
    </div>
  );
}
