import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/sign-in-form";
import { titled } from "@/lib/page-title";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  return titled("Sign in · Saathi", "साइन इन · साथी", (await searchParams).lang);
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = (await searchParams).lang === "hi" ? "hi" : "en";
  return <SignInForm lang={lang} />;
}
