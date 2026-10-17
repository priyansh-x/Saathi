/** Local class joiner. Replaces the unused `cn` npm package. */
export function cn(...parts: unknown[]) {
  return parts
    .flatMap((part) => (typeof part === "string" ? [part] : Array.isArray(part) ? part : []))
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(" ");
}
