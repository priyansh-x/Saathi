import { connection } from "next/server";
import { redirect } from "next/navigation";
import { deskCallHref } from "@/lib/bolna/after-test-call";
import { placeExampleDeskCall } from "@/lib/bolna/example-desk";
import { placeTestCall } from "@/lib/bolna/place";
import { parentByToken } from "@/lib/db/queries";
import { readLang } from "@/lib/family-load";

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await ctx.params;
  const url = new URL(req.url);
  const lang = readLang(url.searchParams.get("lang") || undefined);
  const from = url.searchParams.get("from") === "today" ? "today" : "settings";
  const parent = await parentByToken(token);
  if (!parent) redirect("/");
  const placed = parent.is_example ? await placeExampleDeskCall(parent.id) : await placeTestCall(parent.id);
  redirect(deskCallHref(token, lang, placed, from));
}
