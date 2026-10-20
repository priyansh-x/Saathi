import { connection } from "next/server";
import { parentByToken } from "@/lib/db/queries";
import { readJson } from "@/lib/http";
import { savePushSubscription, vapidPublicKey } from "@/lib/push";

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await ctx.params;
  const parent = await parentByToken(token);
  if (!parent) return Response.json({ ok: false, error: "expired" }, { status: 404 });
  return Response.json({ ok: true, publicKey: await vapidPublicKey() });
}

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await ctx.params;
  const parent = await parentByToken(token);
  if (!parent) return Response.json({ ok: false, error: "expired" }, { status: 404 });
  const body = (await readJson<{ endpoint?: string; keys?: { p256dh?: string; auth?: string } }>(req)) || {};
  return Response.json(await savePushSubscription(parent.id, body.endpoint || "", body.keys));
}
