import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "../db/client";
import { seed } from "../db/seed";
import { runMockScenario } from "../bolna/mock-run";
import { ackAlert } from "./ack";
import { gateOutbound } from "../outbound";

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

describe("briefing", () => {
  it("logs a child briefing after a completed mock call", async () => {
    const result = await runMockScenario("good");
    assert.equal("call_id" in result && !!result.call_id, true);
    const callId = "call_id" in result ? result.call_id : "";
    const rows = await query<{ template: string; status: string }>(
      `select template, status from outbound_messages where body like '%Saathi called%' and id like $1`,
      [`%${callId}%`],
    );
    const any = await query<{ n: number }>(
      `select count(*)::int as n from outbound_messages
       where parent_id = 'parent_kamla' and template like 'daily_briefing%' and status = 'mock'`,
    );
    assert.ok((any[0]?.n ?? 0) >= 1);
    void rows;
  });
});

describe("alerts and first ack", () => {
  it("sends safety + responder on chest pain and first ack wins", async () => {
    const result = await runMockScenario("chest");
    assert.equal("alert_id" in result, true);
    const alertId = "alert_id" in result ? result.alert_id : "";
    const outbound = await query<{ template: string }>(
      `select template from outbound_messages where id like $1 or id like $2`,
      [`%${alertId}%`, `%alert_${alertId}%`],
    );
    const templates = await query<{ template: string }>(
      `select template from outbound_messages where parent_id = 'parent_kamla' and template in ('safety_alert_emergency','responder_alert_emergency','safety_alert_urgent')`,
    );
    assert.ok(templates.length >= 2);
    const first = await ackAlert(alertId, "Rohit");
    const second = await ackAlert(alertId, "Sunita");
    assert.equal(first.first, true);
    assert.equal(second.first, false);
    assert.equal(second.acked_by, "Rohit");
    const acks = await query<{ n: number }>(
      `select count(*)::int as n from outbound_messages where template like 'alert_ack_update%' and id like $1`,
      [`%${alertId}%`],
    );
    assert.ok((acks[0]?.n ?? 0) >= 1);
    void outbound;
  });
});

describe("allowlist", () => {
  it("blocks a real WhatsApp send off allowlist", () => {
    const prev = process.env.MOCK_WHATSAPP;
    process.env.MOCK_WHATSAPP = "0";
    process.env.ALLOWED_PHONE_NUMBERS = "9999999999";
    const decision = gateOutbound("whatsapp", "+910000000001");
    assert.equal(decision.ok, false);
    process.env.MOCK_WHATSAPP = prev;
  });
});
