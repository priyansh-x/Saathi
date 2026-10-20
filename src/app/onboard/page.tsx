import type { Metadata } from "next";
import { ResumeDesk } from "@/components/family/resume-desk";
import { OnboardWizard } from "@/components/onboard/wizard";
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
  return (
    <ResumeDesk lang={lang}>
      <OnboardWizard lang={lang} />
    </ResumeDesk>
  );
}
