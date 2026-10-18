import { connection } from "next/server";
import { cookies } from "next/headers";
import { decodeSession, SESSION_COOKIE } from "@/lib/auth/session";
import { parentByToken } from "@/lib/db/queries";
import { canDeleteFamily, createInvite, ownerFor } from "@/lib/members";

export async function POST(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await ctx.params;
  const parent = await parentByToken(token);
  if (!parent) return Response.json({ ok: false, error: "expired" }, { status: 404 });
  const email = decodeSession((await cookies()).get(SESSION_COOKIE)?.value)?.email ?? null;
  const allowed = (await canDeleteFamily(parent.id, email)) || Boolean((await ownerFor(parent.id)) && parent.is_example);
  if (!allowed) return Response.json({ ok: false, error: "Only the first child can invite." }, { status: 403 });
  try {
    const who = (await ownerFor(parent.id))?.full_name || "family";
    return Response.json({ ok: true, ...(await createInvite(parent.id, who)) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not invite.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
