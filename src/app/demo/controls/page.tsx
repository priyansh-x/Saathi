import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readLang } from "@/lib/family-load";
import { titled } from "@/lib/page-title";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  return titled("Demo · EXAMPLE · Saathi", "डेमो · EXAMPLE · साथी", (await searchParams).lang);
}

/** Escalation walks now live on /demo. Old links land there. */
export default async function DemoControlsRedirect({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const lang = readLang((await searchParams).lang);
  redirect(`/demo?lang=${lang}`);
}
