import { cookies } from "next/headers";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { ADMIN_ACTIONS, runAdminAction, type AdminActionName } from "@/lib/admin/actions";
import { ADMIN_COOKIE, adminEnabled, canOpenAdmin, safeAdminNext } from "@/lib/admin/auth";
import { decodeSession, SESSION_COOKIE } from "@/lib/auth/session";

export async function POST(req: Request) {
  await connection();
  if (!adminEnabled()) notFound();
  const jar = await cookies();
  const email = decodeSession(jar.get(SESSION_COOKIE)?.value)?.email ?? null;
  const gate = canOpenAdmin({ cookie: jar.get(ADMIN_COOKIE)?.value, email });
  if (!gate.ok) redirect("/admin");

  const form = await req.formData();
  const action = String(form.get("action") || "") as AdminActionName;
  if (!ADMIN_ACTIONS.has(action)) redirect("/admin?err=action");
  const parentId = String(form.get("parentId") || "") || undefined;
  const alertId = String(form.get("alertId") || "") || undefined;
  const callTime = String(form.get("callTime") || "") || undefined;
  const next = safeAdminNext(String(form.get("next") || "/admin"));
  const who = gate.via === "ops" && email ? email : "admin";
  const result = await runAdminAction({ action, parentId, alertId, callTime, who });
  const url = new URL(next, req.url);
  if (!result.ok) url.searchParams.set("err", result.error);
  else if ("execution_id" in result && result.execution_id) url.searchParams.set("call", String(result.execution_id));
  redirect(`${url.pathname}${url.search}`);
}
