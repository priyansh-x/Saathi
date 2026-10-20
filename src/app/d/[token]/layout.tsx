import type { ReactNode } from "react";
import { Suspense } from "react";

export default function DeskLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-[480px] px-4 pt-6" aria-busy>
          <div className="flex items-center gap-3">
            <div className="size-11 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="mt-6 h-52 animate-pulse rounded-[28px] bg-card" />
          <div className="mt-4 h-24 animate-pulse rounded-[22px] bg-card" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
