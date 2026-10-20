"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type PointerEvent, type ReactNode, type TouchEvent } from "react";
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
  return Boolean(el.closest("input, textarea, select"));
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

  useEffect(() => {
    for (const tab of TABS) {
      router.prefetch(hrefFor(token, tab, lang, extraQuery));
    }
  }, [token, lang, extraQuery, router]);

  function go(dx: number) {
    if (Math.abs(dx) < 48) return;
    const now = Date.now();
    if (now - lastNav.current < 400) return;
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
    if (Math.abs(dx) < Math.abs(dy) * 1.1) return;
    go(dx);
  }

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (fromField(event.target)) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    start.current = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const origin = start.current;
    start.current = null;
    if (!origin || fromField(event.target)) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;
    if (Math.abs(dx) < Math.abs(dy) * 1.1) return;
    go(dx);
  }

  return (
    <div
      className="app-shell touch-pan-y"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        start.current = null;
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {children}
    </div>
  );
}
