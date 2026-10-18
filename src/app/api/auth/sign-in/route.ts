import { connection } from "next/server";
import { startEmailSignIn } from "@/lib/auth/magic";
import { sessionCookie } from "@/lib/auth/session";
import { readJson } from "@/lib/http";

export async function POST(req: Request) {
  await connection();
  const body = await readJson<{ email?: string }>(req);
  const result = await startEmailSignIn(body?.email || "");
  if (!result.ok) return Response.json({ ok: false, error: result.error }, { status: 400 });
  if (result.mode === "mock") {
    return new Response(JSON.stringify({ ok: true, mode: "mock" }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "set-cookie": sessionCookie(result.token),
      },
    });
  }
  return Response.json({ ok: true, mode: "email" });
}
