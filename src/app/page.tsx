import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, PhoneCall } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { AddToHome } from "@/components/pwa/register";
import hero from "../../public/images/hero-maa-balcony.jpg";

const promises = ["No app for her", "Any phone works", "Two lines for you"];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      <div className="relative">
        <div className="grain relative aspect-[4/3.6] overflow-hidden rounded-b-[36px]">
          <Image
            src={hero}
            alt="An older woman on her balcony, answering her phone in the morning"
            fill
            priority
            placeholder="blur"
            sizes="480px"
            className="object-cover object-[70%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/10" />
        </div>
        <div
          className="absolute inset-x-0 top-0 flex items-center justify-between px-5"
          style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}
        >
          <BrandMark tone="light" />
        </div>
        <div className="absolute right-4 bottom-4 left-4 flex items-center gap-3 rounded-[22px] border border-white/50 bg-card/95 p-3.5 shadow-[var(--shadow-float)] backdrop-blur">
          <span className="ring-pulse grid size-10 shrink-0 place-items-center rounded-full bg-good text-white">
            <PhoneCall className="size-[18px]" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] text-ink-3">8:00 AM · Saathi is calling</p>
            <p className="font-devanagari truncate text-[15px]">नमस्ते माँ, दवाई ले ली?</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <h1 className="app-title rise text-[2rem]">
          A morning call for Maa, <span className="serif-line">on the phone she has.</span>
        </h1>
        <p className="rise mt-3 text-[16px] leading-6 text-muted-foreground" style={{ "--d": "80ms" } as CSSProperties}>
          She picks up and talks. You get two calm lines on WhatsApp. If something is wrong, you hear first.
        </p>
        <ul className="rise mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[14px] text-muted-foreground" style={{ "--d": "140ms" } as CSSProperties}>
          {promises.map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <Check className="size-4 text-good" strokeWidth={2.5} aria-hidden />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-auto space-y-3 pt-10">
          <Link href="/onboard" className="btn-primary">
            Set up a call for Maa
            <ArrowRight className="size-[18px]" aria-hidden />
          </Link>
          <Link href="/d/example-kamla" className="btn-secondary">
            See an example family
          </Link>
          <div className="flex justify-center gap-1 pt-1">
            <Link href="/demo" className="btn-quiet text-[14px] text-muted-foreground">
              Walk one EXAMPLE morning
            </Link>
            <Link href="/demo/controls" className="btn-quiet text-[14px] text-ink-3">
              Demo walks
            </Link>
          </div>
          <AddToHome lang="en" />
          <p className="pt-4 text-center text-[13px] text-ink-3">
            <Link href="/privacy" className="underline-offset-2 hover:underline">
              Privacy (draft)
            </Link>
            <span> · Not an emergency service · 112</span>
          </p>
        </div>
      </div>
    </main>
  );
}
