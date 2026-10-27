import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { extractSystemPrompt } from "@/lib/bolna/agent-config";
import { buildCallContext } from "@/lib/bolna/call-context";
import { processBolnaWebhook } from "@/lib/bolna/webhook";
import { prepareMorningCall } from "@/lib/calls/prepare";
import { closeDb, query } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";
import { latestFamilyReply } from "@/lib/family-messages";
import {
  applyFamilyMessageFromWebhook,
  FAMILY_MESSAGE_EN,
  FAMILY_MESSAGE_HI,
  saveFamilyMessage,
  saveFamilyReply,
  validateFamilyMessageText,
} from "./family-messages";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.CALL_PROVIDER = "simulated";
process.env.SAATHI_KILL_SWITCH = "0";

const EXACT = "Pihu, exam ke liye all the best! कल मिलते हैं।";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("family message validation", () => {
  it("rejects 201 characters and accepts 200", () => {
    assert.equal(validateFamilyMessageText("a".repeat(201)).ok, false);
    assert.equal(validateFamilyMessageText("a".repeat(200)).ok, true);
  });

  it("rejects whitespace-only text", () => {
    assert.equal(validateFamilyMessageText("   \n\t  ").ok, false);
  });
});

describe("family message prompt and context", () => {
  it("contains both template lines, ordering, verbatim, skip, and no-promise rules", () => {
    const md = readFileSync(path.join(process.cwd(), "docs/saathi/voice/system_prompt_bolna.md"), "utf8");
    const prompt = extractSystemPrompt(md);
    assert.equal(prompt.includes(FAMILY_MESSAGE_HI), true);
    assert.equal(prompt.includes(FAMILY_MESSAGE_EN), true);
    assert.match(prompt, /after the greeting, and memory callback, before medicines/i);
    assert.match(prompt, /Read the message verbatim; never paraphrase, translate or summarise it/);
    assert.match(prompt, /If \{\{family_message\}\} is empty, skip the step silently/);
    assert.match(prompt, /never says "he will see it right away", "they'll call you back"/);
    assert.match(prompt, /Kal aapne ghutne ke dard ki baat ki thi, aaj kaisa hai\?/);
    assert.match(prompt, /Never mention recordings, notes or databases/);
  });

  it("passes call_memory and empty family_message by default", async () => {
    await query(`delete from family_messages where parent_id = 'parent_kamla'`);
    const ctx = await buildCallContext("parent_kamla");
    assert.equal(typeof ctx.call_memory, "string");
    assert.ok((ctx.call_memory ?? "").length > 0);
    assert.equal(ctx.family_message, "");
    assert.equal(ctx.family_from, "");
    assert.equal(ctx.family_message_id, "");
  });

  it("carries the exact pending text including punctuation and Hindi", async () => {
    await query(`delete from family_messages where parent_id = 'parent_kamla'`);
    const saved = await saveFamilyMessage({
      parentId: "parent_kamla",
      fromName: "Rohit",
      text: EXACT,
      isExample: true,
    });
    assert.equal(saved.ok, true);
    const ctx = await buildCallContext("parent_kamla");
    assert.equal(ctx.family_message, EXACT);
    assert.equal(ctx.family_from, "Rohit");
    assert.equal(ctx.name, "Rohit");
    assert.ok(ctx.family_message_id);
  });
});

describe("family message delivery", () => {
  it("keeps a missed call pending and a completed call without the line pending", async () => {
    await query(`delete from family_messages where parent_id = 'parent_kamla'`);
    const saved = await saveFamilyMessage({ parentId: "parent_kamla", fromName: "Rohit", text: EXACT, isExample: true });
    assert.equal(saved.ok, true);
    if (!saved.ok) return;
    await applyFamilyMessageFromWebhook({
      parentId: "parent_kamla",
      callId: "call_miss_fm",
      durationSec: 0,
      status: "missed",
      transcript: "assistant: namaste",
    });
    let row = await query<{ delivered_at: string | null }>(`select delivered_at from family_messages where id = $1`, [
      saved.id,
    ]);
    assert.equal(row[0]?.delivered_at, null);
    await applyFamilyMessageFromWebhook({
      parentId: "parent_kamla",
      callId: "call_done_silent",
      durationSec: 80,
      status: "completed",
      transcript: JSON.stringify([{ speaker: "saathi", hi: "Namaste Kamla ji.", en: "Namaste." }]),
    });
    row = await query<{ delivered_at: string | null }>(`select delivered_at from family_messages where id = $1`, [saved.id]);
    assert.equal(row[0]?.delivered_at, null);
  });

  it("marks delivered when the line is in the assistant transcript, and replay does not change it", async () => {
    await query(`delete from family_messages where parent_id = 'parent_kamla'`);
    const saved = await saveFamilyMessage({ parentId: "parent_kamla", fromName: "Rohit", text: EXACT, isExample: true });
    assert.equal(saved.ok, true);
    if (!saved.ok) return;
    const transcript = JSON.stringify([
      { speaker: "saathi", hi: `Aaj Rohit ne aapke liye ek sandesh bheja hai: '${EXACT}'.`, en: EXACT },
      { speaker: "parent", hi: "beta se kehna main theek hoon", en: "tell him I am fine" },
    ]);
    await applyFamilyMessageFromWebhook({
      parentId: "parent_kamla",
      callId: "call_played_fm",
      durationSec: 70,
      status: "completed",
      transcript,
      extractedReply: "beta se kehna main theek hoon",
    });
    const first = await query<{ delivered_at: string | null; delivered_call_id: string | null; reply_to_family: string | null }>(
      `select delivered_at, delivered_call_id, reply_to_family from family_messages where id = $1`,
      [saved.id],
    );
    assert.ok(first[0]?.delivered_at);
    assert.equal(first[0]?.delivered_call_id, "call_played_fm");
    assert.equal(first[0]?.reply_to_family, "beta se kehna main theek hoon");
    const reply = await latestFamilyReply("parent_kamla");
    assert.equal(reply?.reply_to_family, "beta se kehna main theek hoon");
    await applyFamilyMessageFromWebhook({
      parentId: "parent_kamla",
      callId: "call_played_fm",
      durationSec: 70,
      status: "completed",
      transcript,
      extractedReply: "duplicate reply should not overwrite",
    });
    const second = await query<{ delivered_call_id: string | null; reply_to_family: string | null }>(
      `select delivered_call_id, reply_to_family from family_messages where id = $1`,
      [saved.id],
    );
    assert.equal(second[0]?.delivered_call_id, "call_played_fm");
    assert.equal(second[0]?.reply_to_family, "beta se kehna main theek hoon");
  });

  it("webhook missed status leaves the message pending", async () => {
    await query(`delete from family_messages where parent_id = 'parent_kamla'`);
    const saved = await saveFamilyMessage({ parentId: "parent_kamla", fromName: "Rohit", text: EXACT, isExample: true });
    assert.equal(saved.ok, true);
    await processBolnaWebhook(
      {
        status: "no-answer",
        conversation_duration: 0,
        context_details: { recipient_data: { parent_id: "parent_kamla" } },
        telephony_data: { to_number: "+910000000000", hangup_reason: "no-answer" },
      },
      `exec_fm_miss_${Date.now()}`,
    );
    if (saved.ok) {
      const row = await query<{ delivered_at: string | null }>(`select delivered_at from family_messages where id = $1`, [
        saved.id,
      ]);
      assert.equal(row[0]?.delivered_at, null);
    }
  });
});

describe("family message kill switch", () => {
  it("still saves a desk message when the kill switch is on, but blocks the call", async () => {
    const prev = process.env.SAATHI_KILL_SWITCH;
    process.env.SAATHI_KILL_SWITCH = "1";
    try {
      const saved = await saveFamilyMessage({
        parentId: "parent_kamla",
        fromName: "Rohit",
        text: "Kal dawai le aana.",
        isExample: true,
      });
      assert.equal(saved.ok, true);
      const placed = await prepareMorningCall("parent_kamla", new Date("2026-10-24T03:30:00.000Z"), { forceTest: true });
      assert.equal("ok" in placed && placed.ok, false);
      if ("ok" in placed && !placed.ok) assert.equal(placed.reason, "kill_switch");
    } finally {
      process.env.SAATHI_KILL_SWITCH = prev ?? "0";
    }
  });
});

describe("saveFamilyReply idempotency", () => {
  it("does not duplicate a reply", async () => {
    await query(`delete from family_messages where parent_id = 'parent_kamla'`);
    const saved = await saveFamilyMessage({ parentId: "parent_kamla", fromName: "Rohit", text: "hello", isExample: true });
    assert.equal(saved.ok, true);
    if (!saved.ok) return;
    const first = await saveFamilyReply({ family_message_id: saved.id, reply: "theek hoon" });
    const second = await saveFamilyReply({ family_message_id: saved.id, reply: "other" });
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    if (second.ok) assert.equal(second.replay, true);
    const row = await query<{ reply_to_family: string | null }>(`select reply_to_family from family_messages where id = $1`, [
      saved.id,
    ]);
    assert.equal(row[0]?.reply_to_family, "theek hoon");
  });
});
