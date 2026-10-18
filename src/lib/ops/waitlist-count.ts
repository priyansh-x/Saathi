import { readFileSync } from "node:fs";
import path from "node:path";

/** Count only. Never returns emails, names, or rows. `null` means the count request failed. */
export async function waitlistSignupCount(fetchImpl: typeof fetch = fetch): Promise<number | null> {
  const url = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (url && key) {
    try {
      const res = await fetchImpl(`${url}/rest/v1/waitlist?select=id`, {
        method: "HEAD",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Prefer: "count=exact",
        },
      });
      if (!res.ok) return null;
      const range = res.headers.get("content-range") || "";
      const n = Number(range.split("/")[1]);
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  }
  try {
    const file = readFileSync(path.join(process.cwd(), "landing/.data/waitlist.json"), "utf8");
    return file
      .trim()
      .split("\n")
      .filter(Boolean).length;
  } catch {
    return 0;
  }
}
