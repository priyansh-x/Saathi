import type { Metadata } from "next";
import { InviteJoin } from "@/components/invite/invite-page";
import { titled } from "@/lib/page-title";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  return titled("Join · Saathi", "जुड़ें · साथी", (await searchParams).lang);
}

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const lang = (await searchParams).lang === "hi" ? "hi" : "en";
  return <InviteJoin lang={lang} />;
}
