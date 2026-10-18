import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { processBolnaWebhook } from "../bolna/webhook";
import { closeDb, query } from "../db/client";
import { seed } from "../db/seed";
import { runDailyTick } from "../cron/tick";
import { recordCallPlacement } from "./prepare";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";

const DIAL = new Date("2026-10-17T03:15:00.000Z"); // 08:45 IST, not the 08:30 slot
const FIVE_MIN = new Date("2026-10-17T03:20:00.000Z");

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("answered calls are not dropped", () => {
  it("stores started_at as the dial clock, not the scheduled call_time", async () => {
    const executionId = `exec_dial_clock_${Date.now()}`;
    await recordCallPlacement({
      parentId: "parent_kamla",
      clock: DIAL,
      executionId,
      status: "in_progress",
    });
    const row = await query<{ started_at: string }>(`select started_at from calls where id = $1`, [executionId]);
    assert.equal(row[0]?.started_at, "2026-10-17T08:45:00+05:30");
    assert.notEqual(row[0]?.started_at, "2026-10-17T08:30:00+05:30");
  });

  it("dial then tick 5 min later then completed webhook keeps the call completed with no missed ladder", async () => {
    await seed();
    const executionId = `exec_keep_answer_${Date.now()}`;
    await recordCallPlacement({
      parentId: "parent_kamla",
      clock: DIAL,
      executionId,
      status: "in_progress",
    });
    const tick = await runDailyTick({ now: FIVE_MIN, elapsedMin: 5 });
    assert.equal(tick.ok, true);
    const afterTick = await query<{ status: string }>(`select status from calls where id = $1`, [executionId]);
    assert.equal(afterTick[0]?.status, "in_progress");
    if (tick.ok) {
      const kamla = tick.results.find((r) => r.parent_id === "parent_kamla");
      assert.ok(kamla && "skipped" in kamla && kamla.skipped === "in_progress");
    }
    const first = await processBolnaWebhook(
      {
        status: "completed",
        conversation_duration: 90,
        transcript: "assistant: Namaste\nuser: Theek thi.",
        extracted_data: { summary_en: "EXAMPLE morning went well.", mood_quote: "Theek thi." },
        context_details: { recipient_data: { parent_id: "parent_kamla" } },
      },
      executionId,
    );
    assert.equal("replay" in first && first.replay, false);
    const row = await query<{ status: string; summary_en: string | null }>(
      `select status, summary_en from calls where id = $1`,
      [executionId],
    );
    assert.equal(row[0]?.status, "completed");
    assert.match(row[0]?.summary_en ?? "", /EXAMPLE morning went well/);
    const soft = await query<{ n: number }>(
      `select count(*)::int as n from outbound_messages where parent_id = 'parent_kamla' and template = 'missed_call_soft' and id like $1`,
      [`%${executionId}%`],
    );
    assert.equal(soft[0]?.n, 0);
    const missed = await query<{ n: number }>(
      `select count(*)::int as n from alerts where call_id = $1 and category = 'MISSED'`,
      [executionId],
    );
    assert.equal(missed[0]?.n, 0);
    const second = await processBolnaWebhook(
      {
        status: "completed",
        conversation_duration: 90,
        transcript: "assistant: Namaste\nuser: Theek thi.",
        extracted_data: { summary_en: "EXAMPLE should not overwrite.", mood_quote: "Theek thi." },
        context_details: { recipient_data: { parent_id: "parent_kamla" } },
      },
      executionId,
    );
    assert.equal("replay" in second && second.replay, true);
    const again = await query<{ summary_en: string | null }>(`select summary_en from calls where id = $1`, [executionId]);
    assert.match(again[0]?.summary_en ?? "", /EXAMPLE morning went well/);
  });
});
