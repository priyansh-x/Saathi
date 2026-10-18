import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { processBolnaWebhook } from "./bolna/webhook";
import { closeDb, query } from "./db/client";
import { ensureSeed, seed } from "./db/seed";
import { recordSpokenConsent } from "./consent";
import { placeMorningCall } from "./bolna/place";

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

describe("first-call consent", () => {
  it("stores given on yes and declines, pauses, and notifies on no", async () => {
    await query(`update parents set consent_status = 'pending', consent_at = null, paused = false where id = 'parent_kamla'`);
    const yes = await recordSpokenConsent({ call_sid: "c_yes", parent_id: "parent_kamla", answer: "yes" });
    assert.equal(yes.status, "given");
    const given = await query<{ consent_status: string }>(`select consent_status from parents where id = 'parent_kamla'`);
    assert.equal(given[0]?.consent_status, "given");

    const no = await recordSpokenConsent({ call_sid: "c_no", parent_id: "parent_kamla", answer: "no" });
    assert.equal(no.status, "declined");
    assert.equal(no.paused, true);
    const parent = await query<{ consent_status: string; paused: boolean }>(
      `select consent_status, paused from parents where id = 'parent_kamla'`,
    );
    assert.equal(parent[0]?.consent_status, "declined");
    assert.equal(parent[0]?.paused, true);
    const outbound = await query<{ n: number }>(
      `select count(*)::int as n from outbound_messages where parent_id = 'parent_kamla' and template like 'consent_declined%'`,
    );
    assert.ok((outbound[0]?.n ?? 0) >= 1);

    const placed = await placeMorningCall("parent_kamla");
    assert.equal(placed.ok, false);
  });

  it("keeps pending on later and retries once the next morning", async () => {
    await seed();
    await query(
      `update parents set consent_status = 'pending', consent_at = null, paused = false, consent_later_count = 0 where id = 'parent_kamla'`,
    );
    const later = await recordSpokenConsent({ call_sid: "c_later_1", parent_id: "parent_kamla", answer: "later" });
    assert.equal(later.status, "pending");
    assert.equal(later.later_count, 1);
    assert.equal(later.paused, false);
    const parent = await query<{ consent_status: string; paused: boolean; consent_later_count: number }>(
      `select consent_status, paused, consent_later_count from parents where id = 'parent_kamla'`,
    );
    assert.equal(parent[0]?.consent_status, "pending");
    assert.equal(parent[0]?.paused, false);
    assert.equal(parent[0]?.consent_later_count, 1);
    const outbound = await query<{ n: number }>(
      `select count(*)::int as n from outbound_messages where parent_id = 'parent_kamla' and template like 'consent_later%'`,
    );
    assert.equal(outbound[0]?.n, 0);

    const executionId = `later1_${Date.now()}`;
    await processBolnaWebhook(
      {
        status: "completed",
        conversation_duration: 20,
        transcript: "assistant: may I call\nuser: baad mein",
        extracted_data: { summary_en: "She hesitated.", mood_quote: "baad mein" },
        context_details: { recipient_data: { parent_id: "parent_kamla" } },
      },
      executionId,
    );
    const words = await query<{ summary_en: string | null; mood_quote: string | null; transcript_json: string | null }>(
      `select summary_en, mood_quote, transcript_json from calls where bolna_execution_id = $1`,
      [executionId],
    );
    assert.equal(words[0]?.summary_en, null);
    assert.equal(words[0]?.mood_quote, null);
    assert.equal(words[0]?.transcript_json, null);

    const nextMorning = new Date("2026-10-19T03:00:00.000Z");
    const retry = await placeMorningCall("parent_kamla", nextMorning);
    assert.equal(retry.ok, true);
  });

  it("stops calling and tells the child after a second later", async () => {
    await seed();
    await query(
      `update parents set consent_status = 'pending', consent_at = null, paused = false, consent_later_count = 0 where id = 'parent_kamla'`,
    );
    await recordSpokenConsent({ call_sid: "c_later_a", parent_id: "parent_kamla", answer: "later" });
    const twice = await recordSpokenConsent({ call_sid: "c_later_b", parent_id: "parent_kamla", answer: "later" });
    assert.equal(twice.status, "pending");
    assert.equal(twice.later_count, 2);
    assert.equal(twice.paused, false);
    const parent = await query<{ consent_status: string; paused: boolean; consent_later_count: number }>(
      `select consent_status, paused, consent_later_count from parents where id = 'parent_kamla'`,
    );
    assert.equal(parent[0]?.consent_status, "pending");
    assert.equal(parent[0]?.paused, false);
    assert.equal(parent[0]?.consent_later_count, 2);
    const outbound = await query<{ n: number }>(
      `select count(*)::int as n from outbound_messages where parent_id = 'parent_kamla' and template like 'consent_later%'`,
    );
    assert.ok((outbound[0]?.n ?? 0) >= 1);
    const placed = await placeMorningCall("parent_kamla", new Date("2026-10-19T03:00:00.000Z"));
    assert.equal(placed.ok, false);
    if (!placed.ok) assert.equal(placed.reason, "consent_later");
  });

  it("does not keep summary, quote, or transcript until consent is given", async () => {
    await seed();
    await query(`update parents set consent_status = 'pending', consent_at = null where id = 'parent_kamla'`);
    const executionId = `pending_${Date.now()}`;
    await processBolnaWebhook(
      {
        status: "completed",
        conversation_duration: 40,
        transcript: "assistant: namaste\nuser: haan theek hoon",
        extracted_data: { summary_en: "She is well.", mood_quote: "theek hoon" },
        context_details: { recipient_data: { parent_id: "parent_kamla" } },
      },
      executionId,
    );
    const row = await query<{ summary_en: string | null; mood_quote: string | null; transcript_json: string | null }>(
      `select summary_en, mood_quote, transcript_json from calls where bolna_execution_id = $1`,
      [executionId],
    );
    assert.equal(row[0]?.summary_en, null);
    assert.equal(row[0]?.mood_quote, null);
    assert.equal(row[0]?.transcript_json, null);
  });

  it("backfills given from a spoken haan left pending on an old database", async () => {
    await seed();
    await query(`update parents set consent_status = 'pending', consent_at = null where id = 'parent_kamla'`);
    await ensureSeed();
    const row = await query<{ consent_status: string }>(`select consent_status from parents where id = 'parent_kamla'`);
    assert.equal(row[0]?.consent_status, "given");
  });
});
