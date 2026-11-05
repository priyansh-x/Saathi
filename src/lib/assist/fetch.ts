/**
 * Outbound HTTP for the voice assistant tools (weather, search, news).
 * The parent is waiting on the phone, so every request is short and bounded.
 */

export const ASSIST_TIMEOUT_MS = 4000;
export const ASSIST_USER_AGENT = "Saathi/1.0 (family voice companion)";

export class AssistFetchError extends Error {
  constructor(
    message: string,
    readonly reason: "timeout" | "http" | "network" | "parse",
  ) {
    super(message);
  }
}

export async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = ASSIST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": ASSIST_USER_AGENT, ...(init.headers || {}) },
      signal: controller.signal,
    });
    if (!res.ok) throw new AssistFetchError(`${res.status} from ${new URL(url).host}`, "http");
    return res;
  } catch (err) {
    if (err instanceof AssistFetchError) throw err;
    if (controller.signal.aborted) throw new AssistFetchError(`timeout from ${new URL(url).host}`, "timeout");
    throw new AssistFetchError(`network error from ${new URL(url).host}`, "network");
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson<T>(url: string, init: RequestInit = {}, timeoutMs = ASSIST_TIMEOUT_MS): Promise<T> {
  const res = await fetchWithTimeout(url, init, timeoutMs);
  try {
    return (await res.json()) as T;
  } catch {
    throw new AssistFetchError(`bad JSON from ${new URL(url).host}`, "parse");
  }
}

/** Small TTL cache so repeat questions in one call (or many families in one city) do not re-fetch. */
export class TtlCache<T> {
  private rows = new Map<string, { at: number; value: T }>();
  constructor(private readonly ttlMs: number, private readonly max = 200) {}

  get(key: string, now = Date.now()) {
    const row = this.rows.get(key);
    if (!row) return undefined;
    if (now - row.at > this.ttlMs) {
      this.rows.delete(key);
      return undefined;
    }
    return row.value;
  }

  set(key: string, value: T, now = Date.now()) {
    if (this.rows.size >= this.max) {
      const oldest = this.rows.keys().next().value;
      if (oldest !== undefined) this.rows.delete(oldest);
    }
    this.rows.set(key, { at: now, value });
  }

  clear() {
    this.rows.clear();
  }
}

/** Spoken answers stay short: the LLM reads them aloud to an elderly listener. */
export function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("। "));
  return (stop > max * 0.3 ? cut.slice(0, stop + 1) : `${cut.replace(/\s+\S*$/, "")}…`).trim();
}
