"use client";

import { DetailShell } from "@/components/family/chrome";
import { useParams, useSearchParams } from "next/navigation";
import { messages } from "@/lib/i18n/messages";

export default function CallPageError() {
  const params = useParams<{ token: string }>();
  const search = useSearchParams();
  const lang = search.get("lang") === "hi" ? "hi" : "en";
  const t = messages[lang];
  const token = params.token || "";
  const fromToday = search.get("from") === "today";
  const href = fromToday
    ? `/d/${token}${lang === "hi" ? "?lang=hi" : ""}`
    : `/d/${token}/history${lang === "hi" ? "?lang=hi" : ""}`;
  const label = fromToday ? t.backToday : t.backHistory;

  return (
    <DetailShell back={{ href, label: label }}>
        <p className="mt-4 text-[19px] font-semibold">{t.emptyCall}</p>
    </DetailShell>
  );
}
