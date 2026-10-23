import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { EXAMPLE_TOKEN } from "@/lib/config";
import { messages, type Lang } from "@/lib/i18n/messages";

/** Shown when mocks are off. Never dials. */
export function DemoLiveFallback({ lang }: { lang: Lang }) {
  const t = messages[lang];
  return (
    <main className="app-shell">
      <div className="app-shell-scroll px-4 py-8 pb-16">
        <BrandMark />
        <h1 className="app-title mt-8">{t.demoLiveTitle}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t.demoLiveBody}</p>
        <Link href={`/d/${EXAMPLE_TOKEN}?lang=${lang}`} className="btn-primary mt-8">
          {t.demoLiveOpen}
        </Link>
      </div>
    </main>
  );
}
