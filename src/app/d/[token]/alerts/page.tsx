import type { Metadata } from "next";
import { DeskScreen } from "@/components/family/desk-screen";
import { readLang } from "@/lib/family-load";
import { titled } from "@/lib/page-title";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  return titled("Alerts · Saathi", "अलर्ट · साथी", (await searchParams).lang);
}

export default async function AlertsPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { token } = await params;
  return <DeskScreen token={token} lang={readLang((await searchParams).lang)} active="alerts" />;
}
