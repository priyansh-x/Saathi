import { connection } from "next/server";
import { cookies } from "next/headers";
import { allowIp, clientIp } from "@/lib/auth/ip-limit";
import { decodeSession, encodeSession, SESSION_COOKIE, sessionCookie } from "@/lib/auth/session";
import { readJson } from "@/lib/http";
import { logError } from "@/lib/log-error";
import { createHousehold, onboardSaveError, resolveOnboardEmail } from "@/lib/onboard";
import { parseOnboard, type OnboardInput } from "@/lib/onboard-form";

export async function POST(req: Request) {
  await connection();
  if (!allowIp(clientIp(req))) {
    return Response.json({ ok: false, error: "Wait a few minutes, then try again." }, { status: 429 });
  }
  const session = decodeSession((await cookies()).get(SESSION_COOKIE)?.value);
  const body = await readJson<OnboardInput & { email?: string }>(req);
  const email = resolveOnboardEmail(session?.email, body?.email);
  if (!email) return Response.json({ ok: false, error: "Sign in with email first." }, { status: 401 });

  const parsed = parseOnboard(body);
  if (!parsed.ok) return Response.json({ ok: false, error: parsed.error }, { status: 400 });

  try {
    const created = await createHousehold(parsed.data, email);
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (!session) {
      try {
        headers["set-cookie"] = sessionCookie(encodeSession(email));
      } catch (error) {
        await logError("onboard.session", error, { route: "onboard" });
      }
    }
    return new Response(JSON.stringify({ ok: true, ...created }), { status: 200, headers });
  } catch (error) {
    await logError("onboard", error, { route: "onboard" });
    return Response.json({ ok: false, error: onboardSaveError(error) }, { status: 400 });
  }
}
