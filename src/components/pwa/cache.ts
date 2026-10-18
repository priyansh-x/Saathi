"use client";

import { CLEAR_CACHE_MESSAGE } from "@/lib/offline";

export async function clearSaathiCache() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.controller?.postMessage({ type: CLEAR_CACHE_MESSAGE });
  }
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}
