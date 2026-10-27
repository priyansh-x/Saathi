import { cookies } from "next/headers";
import { connection } from "next/server";
import { parentByToken } from "@/lib/db/queries";
import { deskViewCookieName, recordDeskView } from "@/lib/desk-view";

export async function POST(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await ctx.params;
  const parent = await parentByToken(token);
  if (!parent) return Response.json({ ok: false, error: "expired" }, { status: 404 });
  const jar = await cookies();
  const result = await recordDeskView({
    parentId: parent.id,
    cookieStamp: jar.get(deskViewCookieName(parent.id))?.value ?? null,
  });
  if (result.recorded) {
    jar.set(deskViewCookieName(parent.id), new Date().toISOString(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 60,
    });
  }
  return Response.json({ ok: true, recorded: result.recorded });
}
