import { query } from "@/lib/db/client";
import { ackAlert, parseAckIntent, parseAlertId } from "@/lib/whatsapp/ack";

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

export async function processInboundMessages(messages: WaMessage[]) {
  const results = [];
  for (const msg of messages) {
    const text = msg.button?.text || msg.interactive?.button_reply?.title || msg.text?.body || "";
    const payload = msg.button?.payload || msg.interactive?.button_reply?.id || "";
    const intent = parseAckIntent(text) || (payload.toLowerCase().startsWith("ack") ? "ack" : null);
    const alertId =
      parseAlertId(payload) ||
      (await query<{ id: string }>(`select id from alerts where resolved_at is null order by created_at desc limit 1`))[0]
        ?.id;
    if (intent === "ack" && alertId) {
      const from = msg.from ?? "";
      const contacts = await query<{ full_name: string; first_name: string; phone: string }>(
        `select full_name, first_name, phone from contacts`,
      );
      const digits = from.replace(/\D/g, "").slice(-10);
      const match = contacts.find((c) => c.phone.replace(/\D/g, "").endsWith(digits));
      const actor = match?.first_name || match?.full_name || "family";
      results.push(await ackAlert(alertId, actor));
    } else {
      results.push({ ok: true, ignored: true });
    }
  }
  return results;
}
