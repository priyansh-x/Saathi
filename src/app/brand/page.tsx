import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { decodeSession, SESSION_COOKIE } from "@/lib/auth/session";
import { PRODUCT_NAME, PRODUCT_NAME_HI, TAGLINE_EN, WORDMARK_HI } from "@/lib/brand";
import { MarkSvg } from "@/components/mark";
import { canViewOps } from "@/lib/ops/access";
import { titled } from "@/lib/page-title";

export const metadata: Metadata = titled("Brand · Saathi", "ब्रांड · साथी");

export default async function BrandPage() {
  const email = decodeSession((await cookies()).get(SESSION_COOKIE)?.value)?.email ?? null;
  if (!canViewOps(email)) notFound();

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <p className="eyebrow">Internal · OPS_EMAILS</p>
      <h1 className="app-title mt-2">
        {PRODUCT_NAME} / {PRODUCT_NAME_HI}
      </h1>
      <p className="mt-3 text-muted-foreground">{TAGLINE_EN}</p>
      <div className="mt-8 size-24 overflow-hidden rounded-[22px]">
        <MarkSvg className="size-24" />
      </div>
      <p className="mt-4 text-lg font-semibold">{WORDMARK_HI}</p>
      <ul className="mt-6 space-y-1 text-sm">
        <li>Paper #F7F5F0 · Ink #1D1B18 · Brand #B0532A</li>
        <li>Mark is outlined स, not a live font glyph.</li>
      </ul>
    </main>
  );
}
