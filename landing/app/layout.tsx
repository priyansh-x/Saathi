import type { Metadata } from "next";
import { Geist_Mono, Instrument_Serif, Inter, Noto_Sans_Devanagari } from "next/font/google";
import { WaitlistProvider } from "@/components/waitlist";
import { content } from "@/lib/content";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: "normal",
});

const deva = Noto_Sans_Devanagari({
  variable: "--font-deva",
  subsets: ["devanagari"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: content.meta.title,
  description: content.meta.description,
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon.ico" },
    ],
    apple: "/brand/apple-touch-icon.png",
  },
  openGraph: {
    title: content.meta.title,
    description: content.meta.description,
    images: ["/brand/og-image.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} ${instrument.variable} ${deva.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg text-ink">
        <WaitlistProvider>{children}</WaitlistProvider>
      </body>
    </html>
  );
}
