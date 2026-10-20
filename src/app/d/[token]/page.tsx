import type { Metadata } from "next";
import { DeskScreen } from "@/components/family/desk-screen";
import { readLang } from "@/lib/family-load";
import { titled } from "@/lib/page-title";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  return titled("Today · Saathi", "आज · साथी", (await searchParams).lang);
}

export default async function TodayPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string; call?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  return <DeskScreen token={token} lang={readLang(sp.lang)} active="today" callParam={sp.call} />;
}
