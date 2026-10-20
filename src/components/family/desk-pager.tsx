"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ActBanner, TabBar, TopBar } from "@/components/family/chrome";
import { applyDeskUi } from "@/lib/desk-ui";
import { DESK_TABS, type DeskTab } from "@/lib/desk-tabs";
import { qs } from "@/lib/history";
import type { Lang } from "@/lib/i18n/messages";
import type { AlertRow } from "@/lib/db/types";

function hrefFor(token: string, tab: DeskTab, lang: Lang, extraQuery?: Record<string, string | undefined>) {
  const q = qs({ lang, ...(tab === "history" ? extraQuery : {}) });
  if (tab === "today") return `/d/${token}${q}`;
  return `/d/${token}/${tab}${q}`;
}

function fromField(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return Boolean(el?.closest("input, textarea, select"));
}

function isControl(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return Boolean(el?.closest("a, button, [role=button], label"));
}

export function DeskPager({
  token,
  lang,
  active,
  example,
  alerts,
  addressTerm,
  parentName,
  updatedAt,
  extraQuery,
  today,
  history,
  alertsPage,
  settings,
}: {
  token: string;
  lang: Lang;
  active: DeskTab;
  example: boolean;
  alerts: AlertRow[];
  addressTerm?: string | null;
  parentName?: string | null;
  updatedAt?: string | null;
  extraQuery?: Record<string, string | undefined>;
  today: ReactNode;
  history: ReactNode;
  alertsPage: ReactNode;
  settings: ReactNode;
}) {
  const startIndex = Math.max(0, DESK_TABS.indexOf(active));
  const [index, setIndex] = useState(startIndex);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [width, setWidth] = useState(320);
  const pager = useRef<HTMLDivElement>(null);
  const start = useRef<{
    x: number;
    y: number;
    axis: "x" | "y" | null;
    pointerId: number | null;
    control: boolean;
  } | null>(null);
  const indexRef = useRef(index);
  const dragRef = useRef(0);
  const extraRef = useRef(extraQuery);
  const suppressClick = useRef(false);
  extraRef.current = extraQuery;
  indexRef.current = index;
  dragRef.current = drag;

  useEffect(() => {
    setIndex(Math.max(0, DESK_TABS.indexOf(active)));
    setDrag(0);
  }, [active]);

  useEffect(() => {
    applyDeskUi();
  }, []);

  useEffect(() => {
    const el = pager.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth || 320);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(DESK_TABS.length - 1, next));
      setIndex(clamped);
      setDrag(0);
      dragRef.current = 0;
      const tab = DESK_TABS[clamped]!;
      window.history.replaceState(null, "", hrefFor(token, tab, lang, extraRef.current));
    },
    [lang, token],
  );

  useEffect(() => {
    const el = pager.current;
    if (!el) return;

    const widthOf = () => el.clientWidth || 320;

    const begin = (x: number, y: number, pointerId: number | null, target: EventTarget | null) => {
      start.current = { x, y, axis: null, pointerId, control: isControl(target) };
    };

    const move = (x: number, y: number, event: Event, pointerId?: number) => {
      const origin = start.current;
      if (!origin) return;
      const dx = x - origin.x;
      const dy = y - origin.y;
      if (!origin.axis) {
        const slop = origin.control ? 28 : 12;
        if (Math.abs(dx) < slop && Math.abs(dy) < slop) return;
        origin.axis = Math.abs(dx) > Math.abs(dy) * 1.05 ? "x" : "y";
        start.current = origin;
        if (origin.axis === "x") {
          setDragging(true);
          if (pointerId != null) {
            try {
              el.setPointerCapture(pointerId);
            } catch {
              /* ignore */
            }
          }
        }
      }
      if (origin.axis !== "x") return;
      if (event.cancelable) event.preventDefault();
      const width = widthOf();
      const atStart = indexRef.current === 0 && dx > 0;
      const atEnd = indexRef.current === DESK_TABS.length - 1 && dx < 0;
      const next = atStart || atEnd ? dx * 0.35 : dx;
      const clamped = Math.max(-width, Math.min(width, next));
      dragRef.current = clamped;
      setDrag(clamped);
    };

    const end = () => {
      const origin = start.current;
      start.current = null;
      setDragging(false);
      if (!origin || origin.axis !== "x") {
        setDrag(0);
        dragRef.current = 0;
        return;
      }
      suppressClick.current = true;
      const width = widthOf();
      const dx = dragRef.current;
      if (dx < -width * 0.18) go(indexRef.current + 1);
      else if (dx > width * 0.18) go(indexRef.current - 1);
      else {
        setDrag(0);
        dragRef.current = 0;
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      if (fromField(event.target)) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      begin(touch.clientX, touch.clientY, null, event.target);
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      move(touch.clientX, touch.clientY, event);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (fromField(event.target)) return;
      begin(event.clientX, event.clientY, event.pointerId, event.target);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!start.current) return;
      move(event.clientX, event.clientY, event, event.pointerId);
    };
    const onClickCapture = (event: Event) => {
      if (!suppressClick.current) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick.current = false;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("click", onClickCapture, true);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, [go]);

  const x = -index * width + drag;
  const tab = DESK_TABS[index]!;
  const panes = [
    { key: "today", node: today },
    { key: "history", node: history },
    { key: "alerts", node: alertsPage },
    { key: "settings", node: settings },
  ] as const;

  return (
    <div className="app-shell">
      <TopBar token={token} lang={lang} example={example} updatedAt={updatedAt} extraQuery={extraQuery} parentName={parentName || addressTerm || undefined} />
      {tab !== "today" ? <ActBanner token={token} lang={lang} alerts={alerts} /> : null}
      <div ref={pager} className="desk-pager">
        <div
          className="desk-pager-track"
          style={{
            transform: `translate3d(${x}px,0,0)`,
            transition: dragging ? "none" : "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {panes.map((pane) => (
            <section key={pane.key} className="desk-page">
              {pane.node}
            </section>
          ))}
        </div>
      </div>
      <TabBar
        token={token}
        lang={lang}
        active={tab}
        openAlerts={alerts.length}
        extraQuery={extraQuery}
        onTab={(next) => go(DESK_TABS.indexOf(next))}
      />
    </div>
  );
}
