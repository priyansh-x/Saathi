import { connection } from "next/server";
import { verifySignInCode } from "@/lib/auth/code";
import { sessionCookie } from "@/lib/auth/session";
import { readJson } from "@/lib/http";

export async function POST(req: Request) {
  await connection();
  const body = await readJson<{ email?: string; code?: string }>(req);
  const token = await verifySignInCode(body?.email || "", body?.code || "");
  if (!token) return Response.json({ ok: false, error: "That code did not work." }, { status: 400 });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": sessionCookie(token),
    },
  });
}
