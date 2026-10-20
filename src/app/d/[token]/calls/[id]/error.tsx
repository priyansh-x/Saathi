"use client";

import Link from "next/link";
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
    <main className="app-shell px-6 py-16">
      <p className="text-[19px] font-semibold">{t.emptyCall}</p>
      <Link href={href} className="btn-primary mt-6 inline-flex justify-center">
        {label}
      </Link>
    </main>
  );
}
