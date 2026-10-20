import type { ReactNode } from "react";
import { Suspense } from "react";
import { LoadingState } from "@/components/family/chrome";

export default function DeskLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingState />}>{children}</Suspense>;
}
