/**
 * The live WhatsApp path (MOCK_WHATSAPP=0) against a stubbed Graph API.
 * Mock mode skips the opt-in gate, so these bugs only showed up in production:
 * nobody was ever opted in, the neighbour's yes never reached the send gate,
 * and a family-wide idempotency key sent the briefing to the first member only.
 */
import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { closeDb, query } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";
import { acceptInvite, createInvite } from "@/lib/members";
import { createHousehold } from "@/lib/onboard";
import type { OnboardInput } from "@/lib/onboard-form";
import { fixtureButtonMessage, parseWhatsappWebhookJson, processInboundMessages } from "@/lib/whatsapp/inbound";
import { notifyAlert, sendDailyBriefing } from "@/lib/whatsapp/notify";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_EMAIL = "1";
process.env.SAATHI_KILL_SWITCH = "0";
process.env.CALL_PROVIDER = "simulated";

const OWNER = "+910000000021";
const SIBLING = "+910000000022";
const PARENT = "+910000000023";
const NEIGHBOUR = "+910000000024";

const family: OnboardInput = {
  childName: "Meera Iyer",
  childWhatsapp: OWNER,
  parentName: "Lakshmi Iyer",
  addressTerm: "Amma",
  parentPhone: PARENT,
  city: "Chennai",
  languages: ["en"],
  callTime: "08:30",
  medicines: [],
  neighborName: "Kavya",
  neighborPhone: NEIGHBOUR,
  toldParent: true,
};

type Sent = { to: string; type: string; name?: string };
let sent: Sent[] = [];
let metaReply: () => Response = () => new Response(JSON.stringify({ messages: [{ id: "wamid.TEST" }] }), { status: 200 });
const saved: Record<string, string | undefined> = {};
const originalFetch = globalThis.fetch;

const LIVE_ENV: Record<string, string> = {
  MOCK_WHATSAPP: "0",
  WHATSAPP_TOKEN: "test-token",
  WHATSAPP_PHONE_NUMBER_ID: "123456",
  WHATSAPP_VERIFY_TOKEN: "test-verify",
  WHATSAPP_TEMPLATES_APPROVED: "0",
  WHATSAPP_APPROVED_TEMPLATES: [
    "responder_optin",
    "responder_alert_unreachable",
    "responder_alert_emergency",
    "daily_briefing_good",
    "safety_alert_unreachable",
  ].join(","),
  ALLOWED_PHONE_NUMBERS: [OWNER, SIBLING, NEIGHBOUR].join(","),
};

before(async () => {
  await seed();
});

beforeEach(() => {
  for (const [key, value] of Object.entries(LIVE_ENV)) {
    saved[key] = process.env[key];
    process.env[key] = value;
  }
  sent = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input).includes("graph.facebook.com")) {
      const body = JSON.parse(String(init?.body ?? "{}")) as { to: string; type: string; template?: { name: string } };
      sent.push({ to: body.to, type: body.type, name: body.template?.name });
      return metaReply();
    }
    return originalFetch(input, init);
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const key of Object.keys(LIVE_ENV)) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

after(async () => {
  await closeDb();
});

describe("live WhatsApp path", () => {
  it("reaches every member and the neighbour once they have said yes", async () => {
    const created = await createHousehold(family, "meera@example.com");

    // The opt-in request itself goes out (it cannot wait for the yes it asks for), with the country code.
    const optin = sent.find((row) => row.name === "responder_optin");
    assert.ok(optin, `responder_optin not sent: ${JSON.stringify(sent)}`);
    assert.equal(optin.to, "910000000024");

    const invite = await createInvite(created.parentId, "Meera");
    await acceptInvite(invite.token, { email: "arjun@example.com", name: "Arjun Iyer", whatsapp: SIBLING });

    sent = [];
    const briefing = await sendDailyBriefing(created.parentId, {
      id: `live_call_${Date.now()}`,
      mood_quote: "All well.",
      status: "completed",
    });
    assert.equal(briefing.ok, true);
    const briefed = sent.filter((row) => row.name === "daily_briefing_good").map((row) => row.to).sort();
    assert.deepEqual(briefed, ["910000000021", "910000000022"]);

    const yes = parseWhatsappWebhookJson(
      JSON.stringify(fixtureButtonMessage({ from: "910000000024", title: "Yes", payload: "neighbour_yes" })),
    );
    assert.equal(yes.ok, true);
    if (yes.ok) await processInboundMessages(yes.messages);

    sent = [];
    await notifyAlert(created.parentId, {
      id: `live_alert_${Date.now()}`,
      quote: "No answer",
      created_at: "2026-11-05T08:40:00+05:30",
      category: "MISSED",
      level: "look",
    });
    assert.ok(
      sent.some((row) => row.name === "responder_alert_unreachable" && row.to === "910000000024"),
      `neighbour not alerted: ${JSON.stringify(sent)}`,
    );
    const alerted = sent.filter((row) => row.name === "safety_alert_unreachable").map((row) => row.to).sort();
    assert.deepEqual(alerted, ["910000000021", "910000000022"]);
  });

  it("keeps Meta's error code on a rejected send", async () => {
    const created = await createHousehold(
      { ...family, childWhatsapp: SIBLING, parentPhone: "+910000000025", neighborName: "", neighborPhone: "" },
      "arjun2@example.com",
    );
    metaReply = () =>
      new Response(JSON.stringify({ error: { code: 132001, message: "Template name does not exist in the translation" } }), {
        status: 404,
      });
    try {
      await sendDailyBriefing(created.parentId, { id: `live_err_${Date.now()}`, mood_quote: "Ok.", status: "completed" });
    } finally {
      metaReply = () => new Response(JSON.stringify({ messages: [{ id: "wamid.TEST" }] }), { status: 200 });
    }
    const rows = await query<{ status: string }>(
      `select status from outbound_messages where parent_id = $1 and channel = 'whatsapp' and template like 'daily_briefing%'`,
      [created.parentId],
    );
    assert.equal(rows[0]?.status, "failed_meta_404_132001");
  });

  it("acks only the sender's own family's alert", async () => {
    await seed();
    const other = await createHousehold(
      { ...family, childWhatsapp: "+910000000031", parentPhone: "+910000000032", neighborName: "", neighborPhone: "" },
      "other@example.com",
    );
    // The other family's alert is newer, so the old "newest open alert anywhere" fallback picked it.
    await query(
      `insert into alerts (id, parent_id, category, level, quote, created_at, source, is_example)
       values ('alert_mine', 'parent_kamla', 'MISSED', 'look', 'x', '2026-11-05T08:00:00+05:30', 'ladder', true),
              ('alert_theirs', $1, 'MISSED', 'look', 'y', '2026-11-05T09:00:00+05:30', 'ladder', false)`,
      [other.parentId],
    );
    const rohit = await query<{ phone: string }>(`select phone from contacts where id = 'contact_rohit'`);
    await processInboundMessages([{ from: rohit[0]!.phone.replace(/\D/g, ""), type: "text", text: { body: "I'm on it" } }]);
    const rows = await query<{ id: string; acked_at: string | null }>(
      `select id, acked_at from alerts where id in ('alert_mine', 'alert_theirs') order by id`,
    );
    assert.ok(rows.find((row) => row.id === "alert_mine")?.acked_at, "own alert not acked");
    assert.equal(rows.find((row) => row.id === "alert_theirs")?.acked_at, null);
  });

  it("turns WhatsApp back on with START after STOP", async () => {
    await seed();
    const rohit = await query<{ phone: string }>(`select phone from contacts where id = 'contact_rohit'`);
    const from = rohit[0]!.phone.replace(/\D/g, "");
    await processInboundMessages([{ from, type: "text", text: { body: "STOP" } }]);
    await processInboundMessages([{ from, type: "text", text: { body: "START" } }]);
    const row = await query<{ whatsapp_opt_in: boolean; whatsapp_opted_out_at: string | null }>(
      `select whatsapp_opt_in, whatsapp_opted_out_at from contacts where id = 'contact_rohit'`,
    );
    assert.equal(row[0]?.whatsapp_opt_in, true);
    assert.equal(row[0]?.whatsapp_opted_out_at, null);
  });
});
