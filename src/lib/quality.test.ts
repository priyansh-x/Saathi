import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { placeMorningCall } from "./bolna/place";
import { assertLiveSecrets } from "./config";
import { closeDb } from "./db/client";
import { seed } from "./db/seed";
import { istDayBounds } from "./time";
import { sendFamilyMessage } from "./whatsapp/send";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";
process.env.WHATSAPP_TEMPLATES_APPROVED = "1";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("live secrets", () => {
  it("refuses MOCK_BOLNA=0 without Bolna secrets", () => {
    const prev = {
      mock: process.env.MOCK_BOLNA,
      key: process.env.BOLNA_API_KEY,
      tool: process.env.SAATHI_TOOL_TOKEN,
      bolnaTool: process.env.BOLNA_TOOL_TOKEN,
      cron: process.env.CRON_SECRET,
      hook: process.env.BOLNA_WEBHOOK_SECRET,
    };
    process.env.MOCK_BOLNA = "0";
    delete process.env.BOLNA_API_KEY;
    delete process.env.SAATHI_TOOL_TOKEN;
    delete process.env.BOLNA_TOOL_TOKEN;
    delete process.env.CRON_SECRET;
    delete process.env.BOLNA_WEBHOOK_SECRET;
    assert.throws(() => assertLiveSecrets(), /MOCK_BOLNA=0/);
    process.env.MOCK_BOLNA = prev.mock;
    if (prev.key) process.env.BOLNA_API_KEY = prev.key;
    if (prev.tool) process.env.SAATHI_TOOL_TOKEN = prev.tool;
    if (prev.bolnaTool) process.env.BOLNA_TOOL_TOKEN = prev.bolnaTool;
    else delete process.env.BOLNA_TOOL_TOKEN;
    if (prev.cron) process.env.CRON_SECRET = prev.cron;
    if (prev.hook) process.env.BOLNA_WEBHOOK_SECRET = prev.hook;
  });
});

describe("IST day bounds", () => {
  it("covers one IST calendar day with an exclusive end", () => {
    const { start, end } = istDayBounds("2026-10-17");
    assert.equal(start, "2026-10-17T00:00:00+05:30");
    assert.equal(end, "2026-10-18T00:00:00+05:30");
  });
});

describe("outbound fetch", () => {
  it("never reaches fetch for a number off the allowlist when mocks are off", async () => {
    const urls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    const prev = {
      bolna: process.env.MOCK_BOLNA,
      wa: process.env.MOCK_WHATSAPP,
      phones: process.env.ALLOWED_PHONE_NUMBERS,
      emails: process.env.ALLOWED_EMAILS,
    };
    process.env.MOCK_BOLNA = "0";
    process.env.MOCK_WHATSAPP = "0";
    process.env.ALLOWED_PHONE_NUMBERS = "1111111111";
    process.env.ALLOWED_EMAILS = "other@example.invalid";
    process.env.BOLNA_API_KEY = process.env.BOLNA_API_KEY || "test-key";
    process.env.WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "test-wa";
    process.env.WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "test-phone";

    try {
      const placed = await placeMorningCall("parent_kamla");
      assert.equal(placed.ok, false);
      const sent = await sendFamilyMessage({
        parentId: "parent_kamla",
        toPhone: "98765 44110",
        locale: "en",
        intended: "daily_briefing_en",
        vars: ["Kamla", "08:30", "Good", "—", "—", "http://local"],
        idempotencyKey: `quality_fetch_${Date.now()}`,
      });
      assert.equal(sent.channel, "email");
      assert.equal(sent.status, "blocked");
      assert.equal(urls.length, 0);
    } finally {
      globalThis.fetch = original;
      process.env.MOCK_BOLNA = prev.bolna;
      process.env.MOCK_WHATSAPP = prev.wa;
      process.env.ALLOWED_PHONE_NUMBERS = prev.phones;
      process.env.ALLOWED_EMAILS = prev.emails;
    }
  });

  it("falls back to the child's email, not the first ALLOWED_EMAILS entry", async () => {
    const prev = {
      wa: process.env.MOCK_WHATSAPP,
      phones: process.env.ALLOWED_PHONE_NUMBERS,
      emails: process.env.ALLOWED_EMAILS,
    };
    process.env.MOCK_WHATSAPP = "0";
    process.env.ALLOWED_PHONE_NUMBERS = "1111111111";
    process.env.ALLOWED_EMAILS = "other@example.invalid,rohit@example.invalid";

    try {
      const sent = await sendFamilyMessage({
        parentId: "parent_kamla",
        toPhone: "98765 44110",
        locale: "en",
        intended: "daily_briefing_en",
        vars: ["Kamla", "08:30", "Good", "—", "—", "http://local"],
        idempotencyKey: `quality_email_${Date.now()}`,
      });
      assert.equal(sent.channel, "email");
      assert.equal(sent.status, "sent");
      const { query } = await import("./db/client");
      const rows = await query<{ to_phone: string }>(`select to_phone from outbound_messages where id = $1`, [sent.id]);
      assert.equal(rows[0]?.to_phone, "rohit@example.invalid");
    } finally {
      process.env.MOCK_WHATSAPP = prev.wa;
      process.env.ALLOWED_PHONE_NUMBERS = prev.phones;
      process.env.ALLOWED_EMAILS = prev.emails;
    }
  });
});
