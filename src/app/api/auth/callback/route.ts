import { connection } from "next/server";
import { consumeAuthToken } from "@/lib/auth/magic";
import { sessionCookie } from "@/lib/auth/session";
import { publicBaseUrl } from "@/lib/config";

export async function GET(req: Request) {
  await connection();
  const token = new URL(req.url).searchParams.get("token") || "";
  const session = await consumeAuthToken(token);
  if (!session) {
    return Response.redirect(`${publicBaseUrl()}/onboard?error=link`);
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${publicBaseUrl()}/onboard`,
      "set-cookie": sessionCookie(session),
    },
  });
}
