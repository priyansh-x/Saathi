import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { seed } from "../db/seed";
import { closeDb, query } from "../db/client";
import { logMedicine, raiseAlert, saveMemoryNote } from "./tools";
import { processBolnaWebhook } from "./webhook";
import { gateOutbound } from "../outbound";
import { runMockScenario } from "./mock-run";

process.env.MOCK_BOLNA = "1";
process.env.SAATHI_KILL_SWITCH = "0";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("tools idempotency", () => {
  it("logs one dose for the same call_sid + medicine + day", async () => {
    const sid = `t_dose_${Date.now()}`;
    const a = await logMedicine({
      call_sid: sid,
      parent_id: "parent_kamla",
      medicine_name: "Amlodipine",
      status: "taken",
      said: "le li",
    });
    const b = await logMedicine({
      call_sid: sid,
      parent_id: "parent_kamla",
      medicine_name: "Amlodipine",
      status: "not_taken",
      said: "nahi",
    });
    assert.equal(a.ok, true);
    assert.equal(b.ok, true);
    if (a.ok && b.ok) assert.equal(a.dose_log_id, b.dose_log_id);
    const rows = await query<{ n: number }>(
      `select count(*)::int as n from dose_logs where call_id = $1`,
      [sid],
    );
    assert.equal(rows[0]?.n, 1);
  });

  it("saves one memory note per call + note hash", async () => {
    const sid = `t_mem_${Date.now()}`;
    const a = await saveMemoryNote({
      call_sid: sid,
      parent_id: "parent_kamla",
      note: "Terrace plants",
      kind: "follow_up",
    });
    const b = await saveMemoryNote({
      call_sid: sid,
      parent_id: "parent_kamla",
      note: "Terrace plants",
      kind: "follow_up",
    });
    assert.equal(a.note_id, b.note_id);
  });
});

describe("alerts", () => {
  it("creates a mid-call chest-pain alert once", async () => {
    const sid = `t_chest_${Date.now()}`;
    const a = await raiseAlert({
      call_sid: sid,
      parent_id: "parent_kamla",
      category: "EMERGENCY",
      quote: "Seene mein dard ho raha hai.",
    });
    const b = await raiseAlert({
      call_sid: sid,
      parent_id: "parent_kamla",
      category: "EMERGENCY",
      quote: "Seene mein dard ho raha hai.",
    });
    assert.equal(a.alert_id, b.alert_id);
    const rows = await query<{ n: number }>(
      `select count(*)::int as n from alerts where call_id = $1`,
      [sid],
    );
    assert.equal(rows[0]?.n, 1);
  });
});

describe("webhook", () => {
  it("creates one call when the same completed webhook is replayed 3×", async () => {
    const sid = `t_wh_${Date.now()}`;
    const body = {
      status: "completed",
      conversation_duration: 100,
      transcript: "agent: hi\nuser: Neend theek thi.",
      extracted_data: { summary_en: "ok" },
      context_details: { recipient_data: { parent_id: "parent_kamla" } },
    };
    const a = await processBolnaWebhook(body, sid);
    const b = await processBolnaWebhook(body, sid);
    const c = await processBolnaWebhook(body, sid);
    assert.equal(a.call_id, sid);
    assert.equal(b.replay, true);
    assert.equal(c.replay, true);
    const rows = await query<{ n: number }>(
      `select count(*)::int as n from calls where bolna_execution_id = $1 or id = $1`,
      [sid],
    );
    assert.equal(rows[0]?.n, 1);
  });

  it("fires exactly one late alert when the mid-call tool row is missing", async () => {
    const sid = `t_late_${Date.now()}`;
    const body = {
      status: "completed",
      conversation_duration: 80,
      transcript: "agent: hello\nuser: Bathroom mein phisal gayi.",
      extracted_data: {
        red_flag: { category: "EMERGENCY" as const, quote: "Bathroom mein phisal gayi." },
      },
      context_details: { recipient_data: { parent_id: "parent_kamla" } },
    };
    await processBolnaWebhook(body, sid);
    await processBolnaWebhook(body, sid);
    const rows = await query<{ late: boolean }>(
      `select late from alerts where call_id = $1 and category = 'EMERGENCY'`,
      [sid],
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.late, true);
  });
});

describe("outbound gate", () => {
  it("refuses a number that is not allowlisted when mock is off", async () => {
    const prev = process.env.MOCK_BOLNA;
    process.env.MOCK_BOLNA = "0";
    process.env.ALLOWED_PHONE_NUMBERS = "9999999999";
    const decision = gateOutbound("call", "98100 22118");
    assert.equal(decision.ok, false);
    process.env.MOCK_BOLNA = prev;
  });
});

describe("mock scenarios", () => {
  it("runs a good morning fixture", async () => {
    const result = await runMockScenario("good");
    assert.equal("ok" in result && result.ok, true);
  });
});
