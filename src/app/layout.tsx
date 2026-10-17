import type { Metadata } from "next";
import { Figtree, Fraunces, Geist_Mono, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Daily voice check-in",
  description:
    "A voice agent that calls Indian parents on the phone they already own, then briefs the child. See prd.md.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${fraunces.variable} ${geistMono.variable} ${devanagari.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
