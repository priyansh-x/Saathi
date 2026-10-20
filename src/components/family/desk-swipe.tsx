"use client";

import { useRouter } from "next/navigation";
import { useRef, type PointerEvent, type ReactNode, type WheelEvent } from "react";
import { qs } from "@/lib/history";
import type { Lang } from "@/lib/i18n/messages";

const TABS = ["today", "history", "alerts", "settings"] as const;
type Tab = (typeof TABS)[number];

function hrefFor(token: string, tab: Tab, lang: Lang, extraQuery?: Record<string, string | undefined>) {
  const q = qs({ lang, ...(tab === "history" ? extraQuery : {}) });
  if (tab === "today") return `/d/${token}${q}`;
  return `/d/${token}/${tab}${q}`;
}

function fromField(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return Boolean(el.closest("input, textarea, select, button"));
}

export function DeskSwipe({
  token,
  lang,
  active,
  extraQuery,
  children,
}: {
  token: string;
  lang: Lang;
  active: string;
  extraQuery?: Record<string, string | undefined>;
  children: ReactNode;
}) {
  const router = useRouter();
  const start = useRef<{ x: number; y: number } | null>(null);
  const lastNav = useRef(0);

  function go(dx: number) {
    if (Math.abs(dx) < 64) return;
    const now = Date.now();
    if (now - lastNav.current < 500) return;
    const index = TABS.indexOf(active as Tab);
    if (index < 0) return;
    const next = dx < 0 ? TABS[index + 1] : TABS[index - 1];
    if (!next) return;
    lastNav.current = now;
    router.push(hrefFor(token, next, lang, extraQuery));
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (fromField(event.target)) return;
    start.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const origin = start.current;
    start.current = null;
    if (!origin || fromField(event.target)) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    if (Math.abs(dx) < Math.abs(dy) * 1.15) return;
    go(dx);
  }

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    if (Math.abs(event.deltaX) < 80 || Math.abs(event.deltaX) < Math.abs(event.deltaY)) return;
    go(-event.deltaX);
  }

  return (
    <div
      className="app-shell touch-pan-y"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        start.current = null;
      }}
      onWheel={onWheel}
    >
      {children}
    </div>
  );
}
