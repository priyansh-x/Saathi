import { connection } from "next/server";
import { expiredSessionCookie } from "@/lib/auth/session";

export async function POST() {
  await connection();
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": expiredSessionCookie(),
    },
  });
}
