import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "../db/client";
import { seed } from "../db/seed";
import { processInboundMessages } from "./inbound";
import {
  buildWhatsappPayload,
  sendFamilyMessage,
  sessionWindowOpen,
} from "./send";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("WhatsApp 24h window, unapproved fallback, and gate", () => {
  it("opens the session window only after inbound within 24 hours", () => {
    assert.equal(sessionWindowOpen(null), false);
    assert.equal(sessionWindowOpen("2000-01-01T00:00:00+05:30", new Date("2026-10-18T12:00:00+05:30")), false);
    assert.equal(sessionWindowOpen("2026-10-18T11:00:00+05:30", new Date("2026-10-18T12:00:00+05:30")), true);
  });

  it("sends free text only when the window is open; otherwise a template", () => {
    const closed = buildWhatsappPayload({
      to: "+910000000000",
      template: "daily_briefing_good",
      language: "en",
      vars: ["Maa", "8:04"],
      freeText: "EXAMPLE session reply",
      windowOpen: false,
    });
    assert.equal(closed.type, "template");
    assert.equal(closed.template?.name, "daily_briefing_good");
    assert.equal(closed.template?.language.code, "en");
    const open = buildWhatsappPayload({
      to: "+910000000000",
      template: "daily_briefing_good",
      language: "en",
      vars: ["Maa"],
      freeText: "EXAMPLE session reply",
      windowOpen: true,
    });
    assert.equal(open.type, "text");
    assert.equal(open.text?.body, "EXAMPLE session reply");
  });

  it("records last inbound and mocks a session reply", async () => {
    await processInboundMessages([{ from: "9876544110", type: "text", text: { body: "haan" } }]);
    const rows = await query<{ last_inbound_at: string | null }>(
      `select last_inbound_at from contacts where id = 'contact_rohit'`,
    );
    assert.ok(rows[0]?.last_inbound_at);
    const sent = await sendFamilyMessage({
      parentId: "parent_kamla",
      toPhone: "98765 44110",
      locale: "en",
      intended: "daily_briefing_good",
      vars: ["Maa"],
      idempotencyKey: `win_${Date.now()}`,
      freeText: "EXAMPLE session reply",
    });
    assert.equal(sent.status, "mock_session");
  });

  it("falls back to email through the gate when the template is not approved", async () => {
    const prev = {
      mock: process.env.MOCK_WHATSAPP,
      phones: process.env.ALLOWED_PHONE_NUMBERS,
      emails: process.env.ALLOWED_EMAILS,
      approved: process.env.WHATSAPP_TEMPLATES_APPROVED,
      list: process.env.WHATSAPP_APPROVED_TEMPLATES,
    };
    const urls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    process.env.MOCK_WHATSAPP = "0";
    process.env.WHATSAPP_TEMPLATES_APPROVED = "0";
    process.env.WHATSAPP_APPROVED_TEMPLATES = "";
    process.env.ALLOWED_PHONE_NUMBERS = "98765 44110";
    process.env.ALLOWED_EMAILS = "rohit@example.invalid";
    process.env.WHATSAPP_TOKEN = "example-token";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "example-phone";
    try {
      const sent = await sendFamilyMessage({
        parentId: "parent_kamla",
        toPhone: "98765 44110",
        locale: "en",
        intended: "daily_briefing_good",
        vars: ["Maa", "8:04", "Good", "—", "—", "http://local"],
        idempotencyKey: `unapp_${Date.now()}`,
      });
      assert.equal(sent.channel, "email");
      assert.equal(sent.reason, "unapproved_template");
      assert.equal(urls.length, 0);
      const logged = await query<{ body: string }>(`select body from outbound_messages where id = $1`, [sent.id]);
      assert.match(logged[0]?.body ?? "", /unapproved_template/);
    } finally {
      globalThis.fetch = original;
      process.env.MOCK_WHATSAPP = prev.mock;
      process.env.ALLOWED_PHONE_NUMBERS = prev.phones;
      process.env.ALLOWED_EMAILS = prev.emails;
      process.env.WHATSAPP_TEMPLATES_APPROVED = prev.approved;
      if (prev.list) process.env.WHATSAPP_APPROVED_TEMPLATES = prev.list;
      else delete process.env.WHATSAPP_APPROVED_TEMPLATES;
    }
  });

  it("still uses the outbound gate", async () => {
    const prev = process.env.MOCK_WHATSAPP;
    process.env.MOCK_WHATSAPP = "0";
    process.env.ALLOWED_PHONE_NUMBERS = "1111111111";
    process.env.ALLOWED_EMAILS = "";
    try {
      const sent = await sendFamilyMessage({
        parentId: "parent_kamla",
        toPhone: "98765 44110",
        locale: "en",
        intended: "daily_briefing_good",
        vars: ["Maa"],
        idempotencyKey: `gate_${Date.now()}`,
      });
      assert.equal(sent.ok, false);
      assert.match(sent.status, /blocked/);
    } finally {
      process.env.MOCK_WHATSAPP = prev;
    }
  });
});
