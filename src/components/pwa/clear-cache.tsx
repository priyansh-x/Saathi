"use client";

import { clearSaathiCache } from "@/components/pwa/cache";
import { clearDeskToken } from "@/lib/storage";

export function CachedAction({
  action,
  className,
  children,
}: {
  action: () => Promise<void>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form
      action={async () => {
        await clearSaathiCache();
        await action();
      }}
    >
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}

export function SignOutButton({ label, lang = "en" }: { label: string; lang?: "en" | "hi" }) {
  return (
    <button
      type="button"
      className="btn-quiet w-full text-muted-foreground"
      onClick={async () => {
        clearDeskToken();
        try {
          await fetch("/api/auth/sign-out", { method: "POST", credentials: "include" });
        } finally {
          await clearSaathiCache();
          window.location.href = `/signin?lang=${lang}`;
        }
      }}
    >
      {label}
    </button>
  );
}
