import type { Metadata } from "next";
import { PracticeCall } from "@/components/demo/practice-call";
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
  const lang = (await searchParams).lang === "hi" ? "hi" : "en";
  return <PracticeCall lang={lang} />;
}
