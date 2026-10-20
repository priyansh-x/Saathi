import type { Metadata } from "next";
import { DeskScreen } from "@/components/family/desk-screen";
import { readLang } from "@/lib/family-load";
import { titled } from "@/lib/page-title";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  return titled("History · Saathi", "इतिहास · साथी", (await searchParams).lang);
}

export default async function HistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string; days?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  return (
    <DeskScreen token={token} lang={readLang(sp.lang)} active="history" days={sp.days === "7" ? 7 : 30} />
  );
}
