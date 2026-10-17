import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().max(200).optional().default(""),
  contact: z.string().trim().min(1).max(200),
  location: z.string().trim().max(200).optional().default(""),
  parentCity: z.string().trim().max(200).optional().default(""),
  parentLanguage: z.string().trim().max(200).optional().default(""),
  pilotInterest: z.boolean().optional().default(false),
  consent: z.boolean(),
  company: z.string().trim().max(200).optional().default(""),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
  if (parsed.data.company) return Response.json({ ok: true });
  if (!parsed.data.consent) return Response.json({ ok: false }, { status: 400 });

  const row = {
    name: parsed.data.name,
    contact: parsed.data.contact,
    location: parsed.data.location,
    parent_city: parsed.data.parentCity,
    parent_language: parsed.data.parentLanguage,
    pilot_interest: parsed.data.pilotInterest,
    consent: parsed.data.consent,
  };

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url && process.env.NODE_ENV === "production") {
    return Response.json({ ok: false, error: "waitlist_unavailable" }, { status: 503 });
  }
  if (url && key) {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await sb.from("waitlist").insert(row);
    if (error) return Response.json({ ok: false }, { status: 500 });
    return Response.json({ ok: true });
  }

  const dir = path.join(process.cwd(), ".data");
  await mkdir(dir, { recursive: true });
  await appendFile(path.join(dir, "waitlist.json"), `${JSON.stringify({ ...row, created_at: new Date().toISOString() })}\n`);
  return Response.json({ ok: true });
}
