"use client";

import { useEffect, type RefObject } from "react";

export function useReveal() {
  useEffect(() => {
    document.documentElement.classList.add("js");
    const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-in", "");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.2 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
}

export function useInViewLoop(ref: RefObject<HTMLElement | null>, on: (on: boolean) => void) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        on(Boolean(entries[0]?.isIntersecting));
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, on]);
}
