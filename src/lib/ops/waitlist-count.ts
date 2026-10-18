import { readFileSync } from "node:fs";
import path from "node:path";

/** Count only. Never returns emails, names, or rows. */
export async function waitlistSignupCount(fetchImpl: typeof fetch = fetch) {
  const url = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (url && key) {
    const res = await fetchImpl(`${url}/rest/v1/waitlist?select=id`, {
      method: "HEAD",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "count=exact",
      },
    });
    const range = res.headers.get("content-range") || "";
    const n = Number(range.split("/")[1]);
    return Number.isFinite(n) ? n : 0;
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
