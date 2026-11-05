import { query } from "@/lib/db/client";
import { parseNeighbourIntent, recordNeighbourReply } from "@/lib/neighbour";
import { ackAlert, parseAckIntent, parseAlertId } from "@/lib/whatsapp/ack";
import { isWhatsappOptInText, isWhatsappOptOutText } from "@/lib/whatsapp/gate";
import { nowIstStamp } from "@/lib/time";

export type WaMessage = {
  from?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string; payload?: string };
  interactive?: { button_reply?: { id?: string; title?: string } };
};

export function fixtureButtonMessage(args: { from: string; title: string; payload: string }) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        changes: [
          {
            value: {
              messages: [
                {
                  from: args.from,
                  type: "button",
                  button: { text: args.title, payload: args.payload },
                } satisfies WaMessage,
              ],
            },
          },
        ],
      },
    ],
  };
}

export function parseWhatsappWebhookJson(raw: string): { ok: true; messages: WaMessage[] } | { ok: false } {
  try {
    const body = JSON.parse(raw || "{}") as {
      entry?: { changes?: { value?: { messages?: WaMessage[] } }[] }[];
    };
    const messages = body.entry?.flatMap((e) => e.changes?.flatMap((c) => c.value?.messages ?? []) ?? []) ?? [];
    return { ok: true, messages };
  } catch {
    return { ok: false };
  }
}

export async function processInboundMessages(messages: WaMessage[]) {
  const results = [];
  for (const msg of messages) {
    const text = msg.button?.text || msg.interactive?.button_reply?.title || msg.text?.body || "";
    const payload = msg.button?.payload || msg.interactive?.button_reply?.id || "";
    const from = msg.from ?? "";
    const digits = from.replace(/\D/g, "").slice(-10);
    if (digits) {
      await query(
        `update contacts set last_inbound_at = $2
         where regexp_replace(phone, '[^0-9]', '', 'g') like $1`,
        [`%${digits}`, nowIstStamp()],
      );
    }
    if (digits && isWhatsappOptOutText(text)) {
      await query(
        `update contacts
            set whatsapp_opt_in = false, whatsapp_opted_out_at = $2
          where regexp_replace(phone, '[^0-9]', '', 'g') like $1`,
        [`%${digits}`, nowIstStamp()],
      );
      results.push({ ok: true, opted_out: true });
      continue;
    }
    if (digits && isWhatsappOptInText(text)) {
      await query(
        `update contacts
            set whatsapp_opt_in = true, whatsapp_opted_out_at = null
          where regexp_replace(phone, '[^0-9]', '', 'g') like $1`,
        [`%${digits}`],
      );
      results.push({ ok: true, opted_in: true });
      continue;
    }
    if (!digits) {
      // Without a sender we cannot tell whose family this is; never act on it.
      results.push({ ok: true, ignored: true });
      continue;
    }
    const sender = await query<{ parent_id: string; role: string; full_name: string; first_name: string }>(
      `select parent_id, role, full_name, first_name from contacts
        where regexp_replace(phone, '[^0-9]', '', 'g') like $1`,
      [`%${digits}`],
    );
    const neighbourIntent = parseNeighbourIntent(text, payload);
    if (neighbourIntent) {
      const match = sender.find((c) => c.role === "neighbour");
      if (match) {
        results.push(await recordNeighbourReply(match.parent_id, neighbourIntent === "yes"));
        continue;
      }
    }
    const intent = parseAckIntent(text) || (payload.toLowerCase().startsWith("ack") ? "ack" : null);
    // Only the sender's own family's alerts. The old fallback took the newest open alert of any family.
    const families = [...new Set(sender.map((c) => c.parent_id))];
    const payloadAlert = parseAlertId(payload);
    const alertId = families.length
      ? (
          await query<{ id: string }>(
            payloadAlert
              ? `select id from alerts where id = $2 and parent_id = any($1) limit 1`
              : `select id from alerts where parent_id = any($1) and resolved_at is null order by created_at desc limit 1`,
            payloadAlert ? [families, payloadAlert] : [families],
          )
        )[0]?.id
      : undefined;
    if (intent === "ack" && alertId) {
      const match = sender[0];
      const actor = match?.first_name || match?.full_name || "family";
      results.push(await ackAlert(alertId, actor));
    } else {
      results.push({ ok: true, ignored: true });
    }
  }
  return results;
}
