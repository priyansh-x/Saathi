import Link from "next/link";
import type { Metadata } from "next";
import { BrandMark } from "@/components/brand";
import { titled } from "@/lib/page-title";
import { privacyCopy } from "@/lib/privacy-copy";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  return titled("Privacy · Saathi", "गोपनीयता · साथी", (await searchParams).lang);
}

export default async function PrivacyPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = (await searchParams).lang === "hi" ? "hi" : "en";
  const copy = privacyCopy(lang);
  const next = lang === "en" ? "hi" : "en";
  return (
    <main className="mx-auto flex min-h-dvh w-full min-w-0 max-w-[480px] flex-col overflow-x-clip px-5 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between">
        <BrandMark />
        <Link href={`/privacy?lang=${next}`} className="text-sm font-medium text-primary">
          {lang === "en" ? "हिं" : "EN"}
        </Link>
      </div>
      <p className="mt-6 inline-flex w-fit rounded-full bg-amber-soft px-2 py-0.5 text-[11px] font-semibold text-amber-ink">
        {copy.draft}
      </p>
      <h1 className="app-title mt-3 text-[1.75rem]">{copy.title}</h1>
      <p className="mt-3 text-[16px] leading-6 text-muted-foreground">{copy.lead}</p>
      {copy.sections.map((section) => (
        <section key={section.heading} className="card mt-4 p-4">
          <h2 className="font-semibold">{section.heading}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.body}</p>
        </section>
      ))}
      <Link href="/" className="btn-secondary mt-8">
        {lang === "hi" ? "वापस" : "Back"}
      </Link>
    </main>
  );
}
