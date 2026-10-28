"use client";

import { useEffect } from "react";
import { applyDeskUi } from "@/lib/desk-ui";

/** Keep html dataset in sync when the phone theme changes. */
export function DeskUiSync() {
  useEffect(() => {
    applyDeskUi();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyDeskUi();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return null;
}
