import { connection } from "next/server";
import { isMockWhatsapp } from "@/lib/config";
import { ackAlert } from "@/lib/whatsapp/ack";
import { query } from "@/lib/db/client";
import { ensureSeed } from "@/lib/db/seed";
import { readJson } from "@/lib/http";

export async function POST(req: Request) {
  await connection();
  if (!isMockWhatsapp()) {
    return Response.json({ ok: false, error: "mock_disabled" }, { status: 403 });
  }
  await ensureSeed();
  const body = await readJson<{ alert_id?: string; actor?: string }>(req);
  const alertId =
    body?.alert_id ||
    (await query<{ id: string }>(`select id from alerts where acked_at is null and resolved_at is null order by created_at desc limit 1`))[0]
      ?.id;
  if (!alertId) return Response.json({ ok: false, error: "no_open_alert" }, { status: 404 });
  return Response.json(await ackAlert(alertId, body?.actor ?? "family"));
}
