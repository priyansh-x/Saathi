import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Inline the compiled desk CSS so Today paints in one Fast 3G round-trip. */
export function AppStyles() {
  let css = "";
  try {
    css = readFileSync(join(process.cwd(), "src/generated/app.css"), "utf8");
  } catch {
    css = "";
  }
  if (!css) return null;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
