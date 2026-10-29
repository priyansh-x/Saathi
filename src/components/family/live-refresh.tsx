"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function LiveRefresh({ token, stamp }: { token: string; stamp: string }) {
  const router = useRouter();
  const stampRef = useRef(stamp);
  useEffect(() => {
    stampRef.current = stamp;
  }, [stamp]);

  useEffect(() => {
    let timer = 0;
    let busy = stamp.includes("|in_progress|");
    let stopped = false;

    async function tick() {
      if (stopped) return;
      if (typeof document !== "undefined" && document.hidden) {
        timer = window.setTimeout(tick, 4000);
        return;
      }
      try {
        const res = await fetch(`/api/d/${encodeURIComponent(token)}/live`, { cache: "no-store" });
        const body = (await res.json()) as { ok?: boolean; stamp?: string; busy?: boolean };
        if (body.ok && body.stamp && body.stamp !== stampRef.current) {
          router.refresh();
        }
        if (typeof body.busy === "boolean") busy = body.busy;
      } catch {
        /* keep the last cadence */
      }
      timer = window.setTimeout(tick, busy ? 900 : 4000);
    }

    function onVisible() {
      if (typeof document !== "undefined" && document.visibilityState === "visible") void tick();
    }

    timer = window.setTimeout(tick, 200);
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, token, stamp]);

  return null;
}
