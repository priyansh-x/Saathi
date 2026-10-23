"use client";

import { useEffect } from "react";

const WINDOW_MS = 30 * 60 * 1000;

/** Client debounce (localStorage) plus POST; the API also checks a cookie and last insert. Never dials. */
export function DeskViewBeacon({ token }: { token: string }) {
  useEffect(() => {
    const key = `saathi_desk_view_${token}`;
    try {
      const last = Number(localStorage.getItem(key) || 0);
      if (Number.isFinite(last) && Date.now() - last < WINDOW_MS) return;
      localStorage.setItem(key, String(Date.now()));
    } catch {
      /* private mode */
    }
    void fetch(`/api/d/${token}/view`, { method: "POST", credentials: "same-origin" }).catch(() => {});
  }, [token]);
  return null;
}
