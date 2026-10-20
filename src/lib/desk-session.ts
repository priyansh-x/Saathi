import { cookies } from "next/headers";
import { decodeSession, SESSION_COOKIE } from "@/lib/auth/session";
import { deskTokenForEmail } from "@/lib/members";

export async function deskHrefForSession(lang?: string) {
  const session = decodeSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const token = await deskTokenForEmail(session.email);
  if (!token) return null;
  const q = lang === "hi" ? "?lang=hi" : "";
  return `/d/${token}${q}`;
}
