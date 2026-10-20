/** Make pg rows safe to pass across the Next.js server → client boundary. */
export function clientSafe<T>(value: T): T {
  try {
    return JSON.parse(
      JSON.stringify(value, (_key, item) => {
        if (item instanceof Date) return item.toISOString();
        if (typeof item === "bigint") return item.toString();
        return item;
      }),
    ) as T;
  } catch {
    return value;
  }
}
