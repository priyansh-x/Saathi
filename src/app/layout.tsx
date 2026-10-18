import type { ReactNode } from "react";
import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Instrument_Serif, Inter, Noto_Sans_Devanagari } from "next/font/google";
import { PwaRegister } from "@/components/pwa/register";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Saathi",
  description: "A morning phone call for Indian parents. Companionship and reminders — never diagnosis.",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Saathi", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf7f2",
};

function HtmlShell({ children, hi = false }: { children: ReactNode; hi?: boolean }) {
  return (
    <html
      lang={hi ? "hi" : "en"}
      className={`${inter.variable} ${instrument.variable} ${devanagari.variable} h-full ${hi ? "font-devanagari" : ""}`}
    >
      <body className="flex min-h-full flex-col">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}

async function HtmlFromCookie({ children }: { children: ReactNode }) {
  const hi = (await cookies()).get("saathi_lang")?.value === "hi";
  return <HtmlShell hi={hi}>{children}</HtmlShell>;
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<HtmlShell>{children}</HtmlShell>}>
      <HtmlFromCookie>{children}</HtmlFromCookie>
    </Suspense>
  );
}
