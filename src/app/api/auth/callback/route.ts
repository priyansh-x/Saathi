import { connection } from "next/server";
import { consumeAuthToken } from "@/lib/auth/magic";
import { decodeSession, sessionCookie } from "@/lib/auth/session";
import { publicBaseUrl } from "@/lib/config";
import { deskTokenForEmail } from "@/lib/members";

export async function GET(req: Request) {
  await connection();
  const token = new URL(req.url).searchParams.get("token") || "";
  const session = await consumeAuthToken(token);
  if (!session) {
    return Response.redirect(`${publicBaseUrl()}/signin?error=link`);
  }
  const email = decodeSession(session)?.email;
  const desk = email ? await deskTokenForEmail(email) : null;
  const next = desk ? `/family` : `/onboard`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${publicBaseUrl()}${next}`,
      "set-cookie": sessionCookie(session),
    },
  });
}
