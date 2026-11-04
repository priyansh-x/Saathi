"use client";

import { DetailShell } from "@/components/family/chrome";
import { useParams, useSearchParams } from "next/navigation";
import { messages } from "@/lib/i18n/messages";

export default function AlertPageError() {
  const params = useParams<{ token: string }>();
  const search = useSearchParams();
  const lang = search.get("lang") === "hi" ? "hi" : "en";
  const t = messages[lang];
  const token = params.token || "";
  const href = `/d/${token}/alerts${lang === "hi" ? "?lang=hi" : ""}`;
  return (
    <DetailShell back={{ href, label: t.backAlertsShort }}>
        <p className="mt-4 text-[19px] font-semibold">{t.emptyAlerts}</p>
    </DetailShell>
  );
}
