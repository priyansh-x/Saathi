import type { Metadata } from "next";
import { readLang } from "@/lib/family-load";

export function titled(en: string, hi: string, lang?: string): Metadata {
  return { title: readLang(lang) === "hi" ? hi : en };
}
