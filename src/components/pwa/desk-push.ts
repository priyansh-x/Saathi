function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export async function deskPushState() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported" as const;
  return Notification.permission;
}

export async function subscribeDeskPush(token: string) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false as const, reason: "unsupported" as const };
  }
  const ready = await navigator.serviceWorker.ready;
  const keyRes = await fetch(`/api/d/${encodeURIComponent(token)}/push`);
  const keyJson = (await keyRes.json()) as { ok?: boolean; publicKey?: string };
  if (!keyJson.publicKey) return { ok: false as const, reason: "no_key" as const };
  let sub = await ready.pushManager.getSubscription();
  if (!sub) {
    sub = await ready.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyJson.publicKey),
    });
  }
  const json = sub.toJSON();
  if (!json.endpoint) return { ok: false as const, reason: "no_key" as const };
  await fetch(`/api/d/${encodeURIComponent(token)}/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });
  return { ok: true as const };
}

export async function enableDeskPush(token: string) {
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false as const, reason: "unsupported" as const };
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false as const, reason: "denied" as const };
  return subscribeDeskPush(token);
}
