"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

function cookieLang() {
  return /(?:^|;\s*)saathi_lang=hi\b/.test(document.cookie) ? "hi" : "en";
}

/**
 * The root layout only renders once per hard load, so `?lang=` changes made by
 * client navigation never reached <html>. Keep lang + the Devanagari font in step.
 */
export function LangSync() {
  const search = useSearchParams();
  const param = search.get("lang");
  useEffect(() => {
    const lang = param === "hi" || param === "en" ? param : cookieLang();
    const root = document.documentElement;
    root.lang = lang;
    root.classList.toggle("font-devanagari", lang === "hi");
  }, [param]);
  return null;
}
