"use client";

import Link from "next/link";
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
    <main className="app-shell px-6 py-16">
      <p className="text-[19px] font-semibold">{t.emptyAlerts}</p>
      <Link href={href} className="btn-primary mt-6 inline-flex justify-center">
        {t.backAlertsShort}
      </Link>
    </main>
  );
}
