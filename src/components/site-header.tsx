import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-heading text-lg tracking-tight">Morning call</span>
          <span className="hidden text-sm text-muted-foreground sm:inline">for parents at home</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/family" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Family desk
          </Link>
          <Link href="/onboard" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
            Set up
          </Link>
          <Link href="/call" className={cn(buttonVariants({ size: "sm" }))}>
            Call now
          </Link>
        </nav>
      </div>
    </header>
  );
}
