import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ResumeDesk } from "@/components/family/resume-desk";
import { titled } from "@/lib/page-title";
import { ArrowRight, Check } from "lucide-react";
import { IconCall } from "@/components/icons";
import { BrandMark } from "@/components/brand";
import { AddToHome } from "@/components/pwa/register";
import hero from "../../public/images/hero-maa-balcony.jpg";

const PROMISE = {
  en: ["No app for her", "Any phone works", "Two lines for you", "Never a diagnosis"],
  hi: ["उनके लिए ऐप नहीं", "कोई भी फ़ोन", "आपको दो पंक्तियाँ", "कोई निदान नहीं"],
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  return titled("Saathi", "साथी", (await searchParams).lang);
}

export default async function Home({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = (await searchParams).lang === "hi" ? "hi" : "en";
  const hi = lang === "hi";
  return (
    <main className="app-shell">
      <ResumeDesk lang={lang}>
      <div className="app-shell-scroll flex min-h-0 flex-1 flex-col">
      <div className="relative">
        <div className="grain relative aspect-[4/3.6] overflow-hidden rounded-b-[36px]">
          <Image
            src={hero}
            alt="An older woman on her balcony, answering her phone in the morning"
            fill
            priority
            placeholder="blur"
            sizes="(max-width: 480px) 100vw, 480px"
            className="object-cover object-[70%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/10" />
        </div>
        <div
          className="absolute inset-x-0 top-0 flex items-center justify-between px-5"
          style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}
        >
          <BrandMark tone="light" />
          <Link href={hi ? "/" : "/?lang=hi"} className="text-sm font-medium text-white">
            {hi ? "EN" : "हिं"}
          </Link>
        </div>
        <div className="absolute right-4 bottom-4 left-4 flex items-center gap-3 rounded-[22px] border border-white/50 bg-card/95 p-3.5 shadow-[var(--shadow-float)] backdrop-blur">
          <span className="ring-pulse grid size-10 shrink-0 place-items-center rounded-full bg-good text-white">
            <IconCall className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] text-ink-3">8:00 AM · Saathi is calling</p>
            <p className="font-devanagari truncate text-[15px]">नमस्ते माँ, दवाई ले ली?</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <h1 className="app-title rise text-[2rem]">
          {hi ? (
            <>
              माँ के लिए सुबह की कॉल, <span className="serif-line">उसी फ़ोन पर जो उनके पास है।</span>
            </>
          ) : (
            <>
              A morning call for Maa, <span className="serif-line">on the phone she has.</span>
            </>
          )}
        </h1>
        <p className="rise mt-3 text-[16px] leading-6 text-muted-foreground" style={{ "--d": "80ms" } as CSSProperties}>
          {hi
            ? "वे फ़ोन उठाती हैं और बात करती हैं। आपको व्हाट्सऐप पर दो शांत पंक्तियाँ मिलती हैं। कुछ गड़बड़ हो तो पहले आपको पता चलता है।"
            : "She picks up and talks. You get two calm lines on WhatsApp. If something is wrong, you hear first."}
        </p>
        <ul className="rise mt-5 grid grid-cols-2 gap-2" style={{ "--d": "140ms" } as CSSProperties}>
          {PROMISE[lang].map((item) => (
            <li key={item} className="card flex min-h-[64px] items-center gap-2.5 px-3.5 py-3 text-[13.5px] leading-snug text-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-good" strokeWidth={2.5} aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto space-y-3 pt-10">
          <Link href={`/onboard?lang=${lang}`} className="btn-primary">
            {hi ? "माँ के लिए कॉल सेट करें" : "Set up a call for Maa"}
            <ArrowRight className="size-[18px]" aria-hidden />
          </Link>
          <Link href={`/signin?lang=${lang}`} className="btn-secondary">
            {hi ? "साइन इन। परिवार डेस्क" : "Sign in to your family desk"}
          </Link>
          <Link href={`/d/example-kamla?lang=${lang}`} className="btn-secondary">
            {hi ? "उदाहरण परिवार देखें" : "See an example family"}
          </Link>
          <AddToHome lang={lang} />
          <p className="pt-4 text-center text-[13px] text-ink-3">
            <Link href={`/privacy?lang=${lang}`} className="underline-offset-2 hover:underline">
              {hi ? "गोपनीयता (मसौदा)" : "Privacy (draft)"}
            </Link>
            <span>{hi ? " · आपात सेवा नहीं · 112" : " · Not an emergency service · 112"}</span>
          </p>
        </div>
      </div>
      </div>
      </ResumeDesk>
    </main>
  );
}
