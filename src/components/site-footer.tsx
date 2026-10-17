import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <p>The parent answers a phone. The child reads two lines. Silence is never “no news.”</p>
        <Link href="/onboard" className="hover:text-foreground">
          Set up a household
        </Link>
      </div>
    </footer>
  );
}
