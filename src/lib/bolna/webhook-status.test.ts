import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "../db/client";
import { seed } from "../db/seed";
import { isMissedBolnaStatus, normalizeBolnaStatus, processBolnaWebhook, type BolnaWebhook } from "./webhook";

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
      assert.equal(call[0]?.status, "missed");
      const attempts = await query<{ result: string; offset_min: number }>(
        `select result, offset_min from call_attempts where call_id = $1`,
        [sid],
      );
      assert.ok(attempts.some((row) => row.offset_min === 0));
      const expected = status === "no-answer" ? "no_answer" : status;
      assert.equal(attempts[0]?.result, expected);
    });
  }
});
