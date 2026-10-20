import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "../db/client";
import { seed } from "../db/seed";
import { nowIstStamp } from "../time";
import { processBolnaWebhook } from "./webhook";
import { parseBolnaTranscript, transcriptHasParent } from "./transcript";
import { canPlaceLiveCall, parseTestCallArgs, plannedTestCall } from "./test-call-cli";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("Bolna transcript", () => {
  it("parses assistant and user lines", () => {
    const turns = parseBolnaTranscript("assistant: Namaste\nuser: Neend theek thi.");
    assert.deepEqual(turns, [
      { speaker: "saathi", text: "Namaste" },
      { speaker: "parent", text: "Neend theek thi." },
    ]);
    assert.equal(transcriptHasParent("assistant: hi"), false);
    assert.equal(transcriptHasParent("user: haan"), true);
    assert.equal(transcriptHasParent([{ role: "user", content: "Theek hai." }]), true);
  });
});

describe("Bolna webhook live rules", () => {
  it("ignores statuses other than completed", async () => {
    const sid = `t_ring_${Date.now()}`;
    const result = await processBolnaWebhook(
      {
        status: "ringing",
        conversation_duration: 12,
        transcript: "user: hello",
        context_details: { recipient_data: { parent_id: "parent_kamla" } },
      },
      sid,
    );
    assert.equal("ignored" in result && result.ignored, true);
    const rows = await query<{ n: number }>(`select count(*)::int as n from calls where id = $1`, [sid]);
    assert.equal(rows[0]?.n, 0);
  });

  it("treats completed with no conversation_duration as no conversation", async () => {
    const sid = `t_silent_${Date.now()}`;
    const result = await processBolnaWebhook(
      {
        status: "completed",
        conversation_duration: 0,
        transcript: "assistant: Namaste",
        context_details: { recipient_data: { parent_id: "parent_kamla" } },
      },
      sid,
    );
    assert.equal("status" in result && result.status, "no_conversation");
  });

  it("stores IST offsets, never Z", async () => {
    const stamp = nowIstStamp();
    assert.match(stamp, /\+05:30$/);
    assert.equal(stamp.includes("Z"), false);
    const sid = `t_tz_${Date.now()}`;
    await processBolnaWebhook(
      {
        status: "completed",
        conversation_duration: 90,
        transcript: "assistant: Namaste\nuser: Theek hai.",
        extracted_data: { summary_en: "ok" },
        context_details: { recipient_data: { parent_id: "parent_kamla" } },
      },
      sid,
    );
    const rows = await query<{ started_at: string; ended_at: string }>(
      `select started_at, ended_at from calls where id = $1`,
      [sid],
    );
    assert.match(rows[0]?.started_at ?? "", /\+05:30$/);
    assert.match(rows[0]?.ended_at ?? "", /\+05:30$/);
    assert.equal(rows[0]?.started_at.includes("Z"), false);
  });
});

describe("test-call CLI", () => {
  it("needs --yes, MOCK_BOLNA=0 and an allowlisted number", () => {
    const parsed = parseTestCallArgs(["+91 90000 00000", "--yes"]);
    assert.equal(parsed.yes, true);
    assert.equal(parsed.phone, "+919000000000");
    assert.equal(canPlaceLiveCall(parsed.phone, false).ok, false);
    assert.equal(canPlaceLiveCall(parsed.phone, true).ok, false);

    const prevMock = process.env.MOCK_BOLNA;
    const prevAllow = process.env.ALLOWED_PHONE_NUMBERS;
    process.env.MOCK_BOLNA = "0";
    process.env.ALLOWED_PHONE_NUMBERS = "+919000000000";
    assert.equal(canPlaceLiveCall("+919000000000", true).ok, true);
    assert.equal(canPlaceLiveCall("+910000000001", true).ok, false);
    assert.equal(plannedTestCall("+910000000001").allowlisted, false);
    process.env.MOCK_BOLNA = prevMock;
    process.env.ALLOWED_PHONE_NUMBERS = prevAllow;
  });
});
