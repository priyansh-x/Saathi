import { connection } from "next/server";
import type { NextRequest } from "next/server";
import { isMockWhatsapp, whatsappVerifyToken } from "@/lib/config";
import { parseWhatsappWebhookJson, processInboundMessages } from "@/lib/whatsapp/inbound";
import { verifyWhatsappSignature } from "@/lib/whatsapp/signature";

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

export async function POST(req: Request) {
  await connection();
  const raw = await req.text();
  if (!isMockWhatsapp()) {
    const secret = process.env.WHATSAPP_APP_SECRET || "";
    const header = req.headers.get("x-hub-signature-256");
    if (!verifyWhatsappSignature(raw, header, secret)) {
      return new Response("forbidden", { status: 403 });
    }
  }
  const parsed = parseWhatsappWebhookJson(raw);
  if (!parsed.ok) {
    return Response.json({ ok: false, error: "bad_json" }, { status: 400 });
  }
  const results = await processInboundMessages(parsed.messages);
  return Response.json({ ok: true, results });
}
