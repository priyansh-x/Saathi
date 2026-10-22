import { cookies } from "next/headers";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ADMIN_COOKIE, adminEnabled, canOpenAdmin } from "@/lib/admin/auth";
import { decodeSession, SESSION_COOKIE } from "@/lib/auth/session";

export async function getAdminGate() {
  await connection();
  if (!adminEnabled()) notFound();
  const jar = await cookies();
  const email = decodeSession(jar.get(SESSION_COOKIE)?.value)?.email ?? null;
  const gate = canOpenAdmin({ cookie: jar.get(ADMIN_COOKIE)?.value, email });
  return { ...gate, email };
}
