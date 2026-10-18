import { connection } from "next/server";
import { cookies } from "next/headers";
import { decodeSession, SESSION_COOKIE } from "@/lib/auth/session";

export async function GET() {
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = decodeSession(token);
  if (!session) return Response.json({ ok: false }, { status: 401 });
  return Response.json({ ok: true, email: session.email });
}
