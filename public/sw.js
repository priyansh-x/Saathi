/* Offline shell. Cache successful GETs. Never cache /api or family writes. */
const VERSION = "saathi-pwa-v4";
const DESK_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const CACHED_AT = "x-saathi-cached-at";

function shouldCache(url, method) {
  if (method !== "GET") return false;
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/")) return false;
  return true;
}

function isDeskPath(pathname) {
  return /^\/d\/[^/]+/.test(pathname);
}

function isFresh(cachedAt, now) {
  if (!cachedAt) return false;
  return now - cachedAt <= DESK_MAX_AGE_MS;
}

async function clearAllCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
}

function banner(html, cachedAt) {
  const lang = /<html[^>]*lang="hi"/.test(html) ? "hi" : "en";
  const stamp = new Date(cachedAt).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });
  const label = lang === "hi" ? `आखिरी अपडेट ${stamp} · ऑफ़लाइन` : `Last updated at ${stamp} · offline`;
  const bar = `<div id="saathi-offline" style="margin:8px 16px;padding:10px 14px;border-radius:999px;background:#F4E6C8;color:#8A5410;font-size:13px;text-align:center">${label}</div>`;
  return html.replace(/<body([^>]*)>/i, `<body$1>${bar}`);
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(clearAllCaches());
  }
});

self.addEventListener("push", (event) => {
  let data = { title: "Saathi", body: "Open the family desk.", url: "/" };
  try {
    data = { ...data, ...(event.data ? event.data.json() : {}) };
  } catch {
    /* keep defaults */
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Saathi", {
      body: data.body || "",
      data: { url: data.url || "/" },
      tag: "saathi-alert",
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => "focus" in client);
      if (existing) return existing.focus();
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (!shouldCache(url, req.method)) return;
  event.respondWith(
    fetch(req)
      .then(async (res) => {
        if (res.ok) {
          const headers = new Headers(res.headers);
          headers.set(CACHED_AT, String(Date.now()));
          const copy = new Response(await res.clone().blob(), { status: res.status, statusText: res.statusText, headers });
          const cache = await caches.open(VERSION);
          await cache.put(req, copy);
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(req);
        if (!hit) return Response.error();
        const cachedAt = Number(hit.headers.get(CACHED_AT) || 0);
        if (isDeskPath(url.pathname) && !isFresh(cachedAt, Date.now())) return Response.error();
        const type = hit.headers.get("content-type") || "";
        if (type.includes("text/html") && cachedAt) {
          const html = await hit.text();
          return new Response(banner(html, cachedAt), { status: hit.status, headers: hit.headers });
        }
        return hit;
      }),
  );
});
