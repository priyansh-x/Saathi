import { connection } from "next/server";
import { isMockWhatsapp } from "@/lib/config";
import { ensureSeed } from "@/lib/db/seed";
import { query } from "@/lib/db/client";
import { readJson } from "@/lib/http";
import { fixtureButtonMessage, processInboundMessages } from "@/lib/whatsapp/inbound";

/** Fixture Meta button tap. Mock only. Never hits Graph. */
export async function POST(req: Request) {
  await connection();
  if (!isMockWhatsapp()) return Response.json({ ok: false, error: "mock_disabled" }, { status: 403 });
  await ensureSeed();
  const body = await readJson<{ from?: string; title?: string; payload?: string; alert_id?: string }>(req);
  const alertId =
    body?.alert_id ||
    (await query<{ id: string }>(`select id from alerts where acked_at is null and resolved_at is null order by created_at desc limit 1`))[0]
      ?.id;
  if (!alertId) return Response.json({ ok: false, error: "no_open_alert" }, { status: 404 });
  const fixture = fixtureButtonMessage({
    from: body?.from || "+910000000001",
    title: body?.title || "I'm going",
    payload: body?.payload || `ack:${alertId}`,
  });
  const messages = fixture.entry.flatMap((e) => e.changes.flatMap((c) => c.value.messages));
  return Response.json({ ok: true, fixture, results: await processInboundMessages(messages) });
}
