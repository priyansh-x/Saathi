import type { Metadata } from "next";
import { Geist_Mono, Instrument_Serif, Inter, Noto_Sans_Devanagari } from "next/font/google";
import { WaitlistProvider } from "@/components/waitlist";
import { content } from "@/lib/content";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
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
  openGraph: {
    title: content.meta.title,
    description: content.meta.description,
    images: ["/images/hero-maa-balcony.jpg"],
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
