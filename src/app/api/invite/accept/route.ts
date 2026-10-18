import { connection } from "next/server";
import { cookies } from "next/headers";
import { decodeSession, SESSION_COOKIE } from "@/lib/auth/session";
import { readJson } from "@/lib/http";
import { acceptInvite } from "@/lib/members";

export async function POST(req: Request) {
  await connection();
  const session = decodeSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return Response.json({ ok: false, error: "Sign in with email first." }, { status: 401 });
  const body = await readJson<{ token?: string; name?: string; whatsapp?: string }>(req);
  try {
    const result = await acceptInvite(body?.token || "", {
      email: session.email,
      name: body?.name || "",
      whatsapp: body?.whatsapp || "",
    });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not join.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
