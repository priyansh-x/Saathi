import { connection } from "next/server";
import { cookies } from "next/headers";
import { decodeSession, SESSION_COOKIE } from "@/lib/auth/session";
import { readJson } from "@/lib/http";
import { createHousehold } from "@/lib/onboard";
import { parseOnboard, type OnboardInput } from "@/lib/onboard-form";

export async function POST(req: Request) {
  await connection();
  const session = decodeSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return Response.json({ ok: false, error: "Sign in with email first." }, { status: 401 });

  const body = await readJson<OnboardInput>(req);
  const parsed = parseOnboard(body);
  if (!parsed.ok) return Response.json({ ok: false, error: parsed.error }, { status: 400 });

  try {
    const created = await createHousehold(parsed.data, session.email);
    return Response.json({ ok: true, ...created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
