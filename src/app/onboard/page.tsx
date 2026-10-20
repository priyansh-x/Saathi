import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResumeDesk } from "@/components/family/resume-desk";
import { OnboardWizard } from "@/components/onboard/wizard";
import { deskHrefForSession } from "@/lib/desk-session";
import { titled } from "@/lib/page-title";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  return titled("Set up · Saathi", "सेटअप · साथी", (await searchParams).lang);
}

export default async function OnboardPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = (await searchParams).lang === "hi" ? "hi" : "en";
  const desk = await deskHrefForSession(lang);
  if (desk) redirect(desk);
  return (
    <>
      <ResumeDesk lang={lang} />
      <OnboardWizard lang={lang} />
    </>
  );
}
