import Link from "next/link";
import { content } from "@/lib/content";

export default function Privacy() {
  return (
    <main className="container-site max-w-2xl py-16">
      <h1 className="text-3xl font-medium">{content.legal.privacyTitle}</h1>
      <p className="mt-4 text-ink-2">{content.legal.privacyBody}</p>
      <Link href="/" className="mt-8 inline-block text-accent">
        ← Saathi
      </Link>
    </main>
  );
}
