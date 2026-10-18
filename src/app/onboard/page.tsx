import { OnboardWizard } from "@/components/onboard/wizard";

export default async function OnboardPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = (await searchParams).lang === "hi" ? "hi" : "en";
  return <OnboardWizard lang={lang} />;
}
