import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { titled } from "@/lib/page-title";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  return titled("Today · Saathi", "आज · साथी", (await searchParams).lang);
}

export default async function FamilyRedirect({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const lang = (await searchParams).lang === "hi" ? "hi" : "en";
  redirect(`/d/example-kamla?lang=${lang}`);
}
