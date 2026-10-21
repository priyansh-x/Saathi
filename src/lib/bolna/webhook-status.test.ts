import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "../db/client";
import { seed } from "../db/seed";
import { backfillAlertsFromTranscripts, hydrateBolnaCall } from "./execution";
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

  it("attaches a completed webhook to the open settings dial even if ids differ", async () => {
    const deskId = `st_open_${Date.now()}`;
    await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
      deskId,
      "parent_kamla",
      "2026-10-20T16:10:00+05:30",
      null,
      null,
      "in_progress",
      null,
      null,
      null,
      null,
      null,
      null,
      deskId,
      true,
    ]);
    const result = await processBolnaWebhook(
      examplePayload("completed", {
        conversation_duration: 88,
        transcript: "assistant: Namaste\nuser: Seene mein dard ho raha hai.",
        extracted_data: {},
      }),
      `st_other_${Date.now()}`,
    );
    assert.equal("call_id" in result && result.call_id, deskId);
    const call = await query<{ status: string; transcript_json: string | null }>(
      `select status, transcript_json from calls where id = $1`,
      [deskId],
    );
    assert.equal(call[0]?.status, "completed");
    assert.ok(call[0]?.transcript_json);
    const alerts = await query<{ n: number }>(
      `select count(*)::int as n from alerts where call_id = $1 and category = 'EMERGENCY'`,
      [deskId],
    );
    assert.ok((alerts[0]?.n ?? 0) >= 1);
  });

  it("raises an emergency alert from chest pain in the transcript when extraction is empty", async () => {
    const sid = `st_chest_${Date.now()}`;
    await processBolnaWebhook(
      examplePayload("completed", {
        conversation_duration: 70,
        transcript: "assistant: Kaisi ho?\nuser: Seene mein dard ho raha hai.",
        extracted_data: {},
      }),
      sid,
    );
    const rows = await query<{ category: string; quote: string; source: string }>(
      `select category, quote, source from alerts where call_id = $1`,
      [sid],
    );
    assert.equal(rows[0]?.category, "EMERGENCY");
    assert.match(rows[0]?.quote || "", /Seene mein dard/);
    assert.equal(rows[0]?.source, "transcript");
    const push = await query<{ n: number }>(
      `select count(*)::int as n from outbound_messages where channel = 'push' and id like $1`,
      [`%alert_alert_${sid}_EMERGENCY%`],
    );
    assert.ok((push[0]?.n ?? 0) >= 1);
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

  it("pulls a finished Bolna execution onto an open settings dial", async () => {
    const sid = `st_pull_${Date.now()}`;
    await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
      sid,
      "parent_kamla",
      "2026-10-20T16:20:00+05:30",
      null,
      null,
      "in_progress",
      null,
      null,
      null,
      null,
      null,
      null,
      sid,
      true,
    ]);
    const prevProvider = process.env.CALL_PROVIDER;
    const prevKey = process.env.BOLNA_API_KEY;
    process.env.CALL_PROVIDER = "bolna";
    process.env.BOLNA_API_KEY = "example-test-key-not-live";
    try {
      const pulled = await hydrateBolnaCall(
        {
          id: sid,
          parent_id: "parent_kamla",
          status: "in_progress",
          ended_at: null,
          transcript_json: null,
          bolna_execution_id: sid,
        },
        async () =>
          new Response(
            JSON.stringify({
              status: "completed",
              conversation_duration: 70,
              transcript: "assistant: Kaisi ho?\nuser: Seene mein dard ho raha hai.",
              context_details: { recipient_data: { parent_id: "parent_kamla" } },
            }),
            { status: 200 },
          ),
      );
      assert.equal(pulled, true);
      const call = await query<{ status: string; transcript_json: string | null }>(
        `select status, transcript_json from calls where id = $1`,
        [sid],
      );
      assert.equal(call[0]?.status, "completed");
      assert.ok(call[0]?.transcript_json);
      const alerts = await query<{ n: number }>(
        `select count(*)::int as n from alerts where call_id = $1 and category = 'EMERGENCY'`,
        [sid],
      );
      assert.ok((alerts[0]?.n ?? 0) >= 1);
    } finally {
      if (prevProvider) process.env.CALL_PROVIDER = prevProvider;
      else delete process.env.CALL_PROVIDER;
      if (prevKey) process.env.BOLNA_API_KEY = prevKey;
      else delete process.env.BOLNA_API_KEY;
    }
  });

  it("raises a chest-pain alert from a stored transcript that never got a webhook flag", async () => {
    const sid = `st_backfill_${Date.now()}`;
    await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
      sid,
      "parent_kamla",
      "2026-10-20T17:08:00+05:30",
      "2026-10-20T17:12:00+05:30",
      240,
      "completed",
      "Settings test call.",
      null,
      "I have chest pain.",
      "en",
      JSON.stringify([{ speaker: "parent", hi: "I have chest pain.", en: "I have chest pain." }]),
      null,
      sid,
      true,
    ]);
    const raised = await backfillAlertsFromTranscripts("parent_kamla");
    assert.ok(raised >= 1);
    const alerts = await query<{ quote: string }>(
      `select quote from alerts where call_id = $1 and category = 'EMERGENCY'`,
      [sid],
    );
    assert.match(alerts[0]?.quote || "", /chest pain/i);
  });
});
