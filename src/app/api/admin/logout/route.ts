import { connection } from "next/server";
import { clearAdminCookieHeader } from "@/lib/admin/auth";

export async function POST() {
  await connection();
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/admin",
      "Set-Cookie": clearAdminCookieHeader(),
    },
  });
}
