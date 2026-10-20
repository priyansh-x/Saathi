import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "../db/client";
import { seed } from "../db/seed";
import {
  isFailedBolnaStatus,
  isMissedBolnaStatus,
  normalizeBolnaStatus,
  processBolnaWebhook,
  type BolnaWebhook,
} from "./webhook";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

function examplePayload(status: string, extra: Partial<BolnaWebhook> = {}): BolnaWebhook {
  return {
    status,
    conversation_duration: extra.conversation_duration ?? 0,
    transcript: extra.transcript,
    extracted_data: extra.extracted_data,
    telephony_data: extra.telephony_data ?? {
      hangup_reason: status,
      to_number: "+910000000000",
      from_number: "+910000000000",
      call_type: "outbound",
    },
    context_details: extra.context_details ?? { recipient_data: { parent_id: "parent_kamla" } },
    ...extra,
  };
}

describe("Bolna status mapping", () => {
  it("normalizes no_answer and call_disconnected", () => {
    assert.equal(normalizeBolnaStatus("no_answer"), "no-answer");
    assert.equal(normalizeBolnaStatus("call_disconnected"), "call-disconnected");
    assert.equal(isMissedBolnaStatus("busy"), true);
    assert.equal(isMissedBolnaStatus("call-disconnected"), false);
    assert.equal(isFailedBolnaStatus("balance-low"), true);
    assert.equal(isFailedBolnaStatus("busy"), false);
  });

  it("completed stores telephony_data and nested extracted_data", async () => {
    const sid = `st_done_${Date.now()}`;
    const result = await processBolnaWebhook(
      examplePayload("completed", {
        conversation_duration: "90",
        transcript: "assistant: Namaste\nuser: Theek hai.",
        summary: "EXAMPLE nested morning.",
        extracted_data: {
          Wellbeing: { mood: { subjective: "Theek hai.", objective: "okay", confidence_label: "High" } },
        },
        telephony_data: { recording_url: "https://example.invalid/rec.wav", hangup_reason: "completed" },
      }),
      sid,
    );
    assert.equal("call_id" in result && result.call_id, sid);
    const rows = await query<{ status: string; mood_quote: string | null; recording_url: string | null }>(
      `select status, mood_quote, recording_url from calls where id = $1`,
      [sid],
    );
    assert.equal(rows[0]?.status, "completed");
    assert.equal(rows[0]?.mood_quote, "Theek hai.");
    assert.equal(rows[0]?.recording_url, "https://example.invalid/rec.wav");
  });

  it("call-disconnected is ignored until completed", async () => {
    const sid = `st_disc_${Date.now()}`;
    const result = await processBolnaWebhook(examplePayload("call-disconnected"), sid);
    assert.equal("ignored" in result && result.ignored, true);
    const rows = await query<{ n: number }>(`select count(*)::int as n from calls where id = $1`, [sid]);
    assert.equal(rows[0]?.n, 0);
  });

  for (const status of ["no-answer", "busy", "failed"] as const) {
    it(`${status} starts the missed-call ladder`, async () => {
      const sid = `st_${status}_${Date.now()}`;
      const result = await processBolnaWebhook(examplePayload(status), sid);
      assert.equal("missed" in result && result.missed, true);
      const call = await query<{ status: string }>(`select status from calls where id = $1`, [sid]);
      assert.equal(call[0]?.status, status === "failed" ? "failed" : "missed");
      const attempts = await query<{ result: string; offset_min: number }>(
        `select result, offset_min from call_attempts where call_id = $1`,
        [sid],
      );
      assert.ok(attempts.some((row) => row.offset_min === 0));
      const expected = status === "no-answer" ? "no_answer" : status === "failed" ? "failed" : status;
      assert.equal(attempts[0]?.result, expected);
    });
  }

  for (const status of ["error", "balance-low", "canceled", "stopped"] as const) {
    it(`${status} maps to failed and starts the missed-call ladder`, async () => {
      const sid = `st_${status}_${Date.now()}`;
      const result = await processBolnaWebhook(examplePayload(status), sid);
      assert.equal("missed" in result && result.missed, true);
      const call = await query<{ status: string }>(`select status from calls where id = $1`, [sid]);
      assert.equal(call[0]?.status, "failed");
      const attempts = await query<{ result: string }>(`select result from call_attempts where call_id = $1`, [sid]);
      assert.equal(attempts[0]?.result, "failed");
    });
  }

  it("fills words when a completed call is missing the transcript", async () => {
    const sid = `st_fill_${Date.now()}`;
    await processBolnaWebhook(
      examplePayload("completed", {
        conversation_duration: 40,
        transcript: "assistant: Namaste\nuser: Theek hoon.",
        extracted_data: { summary_en: "She is well.", mood_quote: "Theek hoon." },
      }),
      sid,
    );
    await query(`update calls set transcript_json = null, summary_en = null, mood_quote = null where id = $1`, [sid]);
    const again = await processBolnaWebhook(
      examplePayload("completed", {
        conversation_duration: 40,
        transcript: "assistant: Namaste\nuser: Theek hoon.",
        extracted_data: { summary_en: "She is well.", mood_quote: "Theek hoon." },
      }),
      sid,
    );
    assert.equal("replay" in again && again.replay, false);
    const rows = await query<{ summary_en: string | null; transcript_json: string | null }>(
      `select summary_en, transcript_json from calls where id = $1`,
      [sid],
    );
    assert.equal(rows[0]?.summary_en, "She is well.");
    assert.ok(rows[0]?.transcript_json);
  });

  it("completed with conversation_duration 0 is no_conversation and starts the ladder", async () => {
    const sid = `st_zero_${Date.now()}`;
    const result = await processBolnaWebhook(
      examplePayload("completed", {
        conversation_duration: 0,
        transcript: "assistant: Namaste",
      }),
      sid,
    );
    assert.equal("status" in result && result.status, "no_conversation");
    assert.equal("missed" in result && result.missed, true);
    const call = await query<{ status: string }>(`select status from calls where id = $1`, [sid]);
    assert.equal(call[0]?.status, "no_conversation");
    const attempts = await query<{ n: number }>(
      `select count(*)::int as n from call_attempts where call_id = $1`,
      [sid],
    );
    assert.equal((attempts[0]?.n ?? 0) > 0, true);
  });
});
