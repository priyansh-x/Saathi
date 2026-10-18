"use client";

import { useRouter } from "next/navigation";
import { clearSaathiCache } from "@/components/pwa/cache";

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

export function SignOutButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn-quiet w-full text-muted-foreground"
      onClick={async () => {
        try {
          await fetch("/api/auth/sign-out", { method: "POST" });
        } finally {
          await clearSaathiCache();
          router.push("/");
          router.refresh();
        }
      }}
    >
      {label}
    </button>
  );
}
