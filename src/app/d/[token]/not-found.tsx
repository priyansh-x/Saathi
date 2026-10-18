import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ExpiredLink } from "@/components/family/chrome";
import { titled } from "@/lib/page-title";

export async function generateMetadata(): Promise<Metadata> {
  return titled("Not found · Saathi", "नहीं मिला · साथी", (await cookies()).get("saathi_lang")?.value);
}

export default async function TokenNotFound() {
  const lang = (await cookies()).get("saathi_lang")?.value === "hi" ? "hi" : "en";
  return <ExpiredLink lang={lang} />;
}
