import { connection } from "next/server";
import type { NextRequest } from "next/server";
import { ackAlert, parseAckIntent, parseAlertId } from "@/lib/whatsapp/ack";
import { query } from "@/lib/db/client";
import { whatsappVerifyToken } from "@/lib/config";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token && token === whatsappVerifyToken() && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

type WaMessage = {
  from?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string; payload?: string };
  interactive?: { button_reply?: { id?: string; title?: string } };
};

export async function POST(req: Request) {
  await connection();
  const body = (await req.json().catch(() => null)) as {
    entry?: { changes?: { value?: { messages?: WaMessage[] } }[] }[];
  } | null;
  const messages = body?.entry?.flatMap((e) => e.changes?.flatMap((c) => c.value?.messages ?? []) ?? []) ?? [];
  const results = [];
  for (const msg of messages) {
    const text = msg.button?.text || msg.interactive?.button_reply?.title || msg.text?.body || "";
    const payload = msg.button?.payload || msg.interactive?.button_reply?.id || "";
    const intent = parseAckIntent(text) || (payload.toLowerCase().startsWith("ack") ? "ack" : null);
    const alertId =
      parseAlertId(payload) ||
      (
        await query<{ id: string }>(
          `select id from alerts where resolved_at is null order by created_at desc limit 1`,
        )
      )[0]?.id;
    if (intent === "ack" && alertId) {
      const from = msg.from ?? "";
      const contacts = await query<{ full_name: string; phone: string }>(
        `select full_name, phone from contacts`,
      );
      const actor =
        contacts.find((c) => c.phone.replace(/\D/g, "").endsWith(from.replace(/\D/g, "").slice(-10)))?.full_name ??
        "Rohit";
      results.push(await ackAlert(alertId, actor));
    } else {
      results.push({ ok: true, ignored: true });
    }
  }
  return Response.json({ ok: true, results });
}
