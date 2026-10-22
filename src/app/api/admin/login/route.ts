import { connection } from "next/server";
import { redirect } from "next/navigation";
import { adminCookieHeader, adminEnabled, adminPassword, encodeAdminCookie, passwordsMatch } from "@/lib/admin/auth";

export async function POST(req: Request) {
  await connection();
  if (!adminEnabled() || !adminPassword()) {
    return new Response("Not found", { status: 404 });
  }
  const form = await req.formData().catch(() => null);
  const password = String(form?.get("password") || "");
  if (!passwordsMatch(password)) {
    redirect("/admin?err=1");
  }
  const res = new Response(null, {
    status: 303,
    headers: {
      Location: "/admin",
      "Set-Cookie": adminCookieHeader(encodeAdminCookie()),
    },
  });
  return res;
}
