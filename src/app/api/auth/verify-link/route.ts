import { connection } from "next/server";
import { allowIp, clientIp } from "@/lib/auth/ip-limit";
import { consumeSupabaseAuthLink } from "@/lib/auth/supabase-otp";
import { sessionCookie, encodeSession } from "@/lib/auth/session";
import { emailMaySignIn } from "@/lib/members";
import { readJson } from "@/lib/http";

export async function POST(req: Request) {
  await connection();
  if (!allowIp(clientIp(req))) {
    return Response.json({ ok: false, error: "Wait a few minutes, then try again." }, { status: 429 });
  }
  const body = await readJson<{ link?: string }>(req);
  const consumed = await consumeSupabaseAuthLink(body?.link || "");
  if (!consumed) {
    return Response.json({ ok: false, error: "That link did not work. Copy the full link from the email." }, { status: 400 });
  }
  if (!(await emailMaySignIn(consumed.email))) {
    return Response.json({ ok: false, error: "Pilot is invite-only for now" }, { status: 400 });
  }
  return new Response(JSON.stringify({ ok: true, email: consumed.email }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": sessionCookie(encodeSession(consumed.email)),
    },
  });
}
