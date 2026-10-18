import { connection } from "next/server";
import { parentByToken } from "@/lib/db/queries";
import { readJson } from "@/lib/http";
import {
  actorName,
  addMedicine,
  editMedicine,
  removeMedicine,
  updateCallTime,
  updateLanguages,
  updateNeighbour,
  updatePaused,
} from "@/lib/settings";

type Body = {
  action?: string;
  callTime?: string;
  languages?: string[];
  paused?: boolean;
  name?: string;
  phone?: string;
  clear?: boolean;
  id?: string;
  time?: string;
  meal?: string;
};

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await ctx.params;
  const parent = await parentByToken(token);
  if (!parent) return Response.json({ ok: false, error: "expired" }, { status: 404 });
  const body = (await readJson<Body>(req)) || {};
  const who = await actorName(parent.id);

  try {
    switch (body.action) {
      case "call_time":
        return Response.json(await updateCallTime(parent.id, body.callTime || "", who));
      case "languages":
        return Response.json(await updateLanguages(parent.id, body.languages || [], who));
      case "pause":
        return Response.json(await updatePaused(parent.id, Boolean(body.paused), who));
      case "neighbour":
        return Response.json(
          await updateNeighbour(
            parent.id,
            body.clear ? null : { name: body.name || "", phone: body.phone || "" },
            who,
          ),
        );
      case "medicine_add":
        return Response.json(
          await addMedicine(parent.id, { name: body.name || "", time: body.time || "", meal: body.meal || "with food" }, who),
        );
      case "medicine_edit":
        return Response.json(
          await editMedicine(
            parent.id,
            body.id || "",
            { name: body.name || "", time: body.time || "", meal: body.meal || "with food" },
            who,
          ),
        );
      case "medicine_remove":
        return Response.json(await removeMedicine(parent.id, body.id || "", who));
      default:
        return Response.json({ ok: false, error: "unknown_action" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
