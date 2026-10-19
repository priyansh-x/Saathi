import type { ReactNode } from "react";
import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { IBM_Plex_Sans, IBM_Plex_Sans_Devanagari, Instrument_Serif } from "next/font/google";
import { AppStyles } from "@/components/app-styles";
import { PwaBoot } from "@/components/pwa/boot";

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  preload: false,
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});

const devanagari = IBM_Plex_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "600"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Saathi",
  description: "A morning phone call for Indian parents. Companionship and reminders — never diagnosis.",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Saathi", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Saathi",
    description: "A morning call for Maa, on the phone she has.",
    images: ["/brand/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F7F5F0",
};

function HtmlShell({ children, hi = false }: { children: ReactNode; hi?: boolean }) {
  return (
    <html
      lang={hi ? "hi" : "en"}
      className={`${plex.variable} ${instrument.variable} ${devanagari.variable} h-full ${hi ? "font-devanagari" : ""}`}
    >
      <body className="flex min-h-full flex-col">
        <AppStyles />
        <PwaBoot />
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
