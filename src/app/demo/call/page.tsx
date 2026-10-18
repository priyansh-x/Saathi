import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PracticeCall } from "@/components/demo/practice-call";
import { demoModeAllowed } from "@/lib/demo-mode";
import { titled } from "@/lib/page-title";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  return titled("Practice call · EXAMPLE · Saathi", "अभ्यास कॉल · EXAMPLE · साथी", (await searchParams).lang);
}

export default async function DemoCallPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  if (!demoModeAllowed()) notFound();
  const lang = (await searchParams).lang === "hi" ? "hi" : "en";
  return <PracticeCall lang={lang} />;
}
