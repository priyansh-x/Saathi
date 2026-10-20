import { toIsoString } from "@/lib/time";

function revive(value: unknown): unknown {
  if (value instanceof Date) return toIsoString(value);
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(revive);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) out[key] = revive(item);
    return out;
  }
  return value;
}

/** Make pg rows safe to pass across the Next.js server → client boundary. */
export function clientSafe<T>(value: T): T {
  try {
    return revive(value) as T;
  } catch {
    return value;
  }
}
