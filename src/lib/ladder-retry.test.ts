import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "./db/client";
import { seed } from "./db/seed";
import { runDailyTick } from "./cron/tick";
import { recordCallPlacement } from "./calls/prepare";
import { advanceLadder } from "./ladder";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";
process.env.CALL_PROVIDER = "simulated";

const T0 = new Date("2026-10-17T03:00:00.000Z"); // 08:30 IST
const T10 = new Date("2026-10-17T03:10:00.000Z");
const T60 = new Date("2026-10-17T04:00:00.000Z");

async function wipeDay() {
  const dayCalls = await query<{ id: string }>(
    `select id from calls where parent_id = 'parent_kamla' and started_at >= '2026-10-17T00:00:00+05:30' and started_at < '2026-10-18T00:00:00+05:30'`,
  );
  for (const call of dayCalls) {
    await query(`delete from alert_events where alert_id in (select id from alerts where call_id = $1)`, [call.id]);
    await query(`delete from alerts where call_id = $1`, [call.id]);
    await query(`delete from dose_logs where call_id = $1`, [call.id]);
    await query(`delete from call_attempts where call_id = $1`, [call.id]);
    await query(`delete from memory_notes where call_id = $1`, [call.id]);
    await query(`delete from calls where id = $1`, [call.id]);
  }
}

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("ladder redials that can happen", () => {
  it("cap=1 still records one simulated retry at 10 min even if BOLNA_API_KEY is set", async () => {
    await seed();
    await wipeDay();
    process.env.CALL_BUDGET_DIALS_DAILY = "1";
    process.env.CALL_PROVIDER = "simulated";
    process.env.BOLNA_API_KEY = "example-test-key-not-live";
    const original = "exec_morning_root";
    await recordCallPlacement({
      parentId: "parent_kamla",
      clock: T0,
      executionId: original,
      status: "in_progress",
    });
    await query(`update calls set status = 'missed' where id = $1`, [original]);
    const urls: string[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return new Response(JSON.stringify({ execution_id: "exec_retry_10" }), { status: 200 });
    }) as typeof fetch;
    try {
      const result = await advanceLadder({
        parentId: "parent_kamla",
        callId: original,
        elapsedMin: 10,
        attemptResult: "no_answer",
        clock: T10,
      });
      assert.ok(result.actions.some((a) => a.startsWith("redial_10")));
      assert.equal(urls.length, 0);
      const chain = await query<{ id: string; parent_call_id: string | null }>(
        `select id, parent_call_id from calls where id = $1 or parent_call_id = $1`,
        [original],
      );
      assert.equal(chain.length, 2);
      assert.equal(chain.filter((row) => row.parent_call_id === original).length, 1);
    } finally {
      globalThis.fetch = originalFetch;
      delete process.env.BOLNA_API_KEY;
      delete process.env.CALL_BUDGET_DIALS_DAILY;
      process.env.CALL_PROVIDER = "simulated";
    }
  });

  it("CALL_PROVIDER=bolna retries through POST /call", async () => {
    await seed();
    await wipeDay();
    process.env.CALL_PROVIDER = "bolna";
    process.env.BOLNA_API_KEY = "example-test-key-not-live";
    process.env.BOLNA_AGENT_ID = "agent_example";
    process.env.ALLOWED_PHONE_NUMBERS = "+910000000000";
    const original = "exec_morning_bolna";
    await recordCallPlacement({
      parentId: "parent_kamla",
      clock: T0,
      executionId: original,
      status: "in_progress",
    });
    await query(`update calls set status = 'missed' where id = $1`, [original]);
    const urls: string[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return new Response(JSON.stringify({ execution_id: "exec_retry_bolna" }), { status: 200 });
    }) as typeof fetch;
    try {
      await advanceLadder({
        parentId: "parent_kamla",
        callId: original,
        elapsedMin: 10,
        attemptResult: "no_answer",
        clock: T10,
      });
      assert.equal(urls.length, 1);
      assert.match(urls[0]!, /\/call/);
    } finally {
      globalThis.fetch = originalFetch;
      process.env.CALL_PROVIDER = "simulated";
      delete process.env.BOLNA_API_KEY;
      delete process.env.BOLNA_AGENT_ID;
      delete process.env.ALLOWED_PHONE_NUMBERS;
    }
  });

  it("late tick at 60 min places one retry and does not escalate in that tick", async () => {
    await seed();
    await wipeDay();
    process.env.CALL_BUDGET_DIALS_DAILY = "1";
    process.env.BOLNA_API_KEY = "example-test-key-not-live";
    const original = "exec_morning_late";
    await recordCallPlacement({
      parentId: "parent_kamla",
      clock: T0,
      executionId: original,
      status: "in_progress",
    });
    await query(`update calls set status = 'missed' where id = $1`, [original]);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ execution_id: `exec_retry_late_${Date.now()}` }), { status: 200 });
    }) as typeof fetch;
    try {
      const tick = await runDailyTick({ now: T60, elapsedMin: 60 });
      assert.equal(tick.ok, true);
      const retries = await query<{ id: string }>(
        `select id from calls where parent_call_id = $1`,
        [original],
      );
      assert.equal(retries.length, 1);
      const alerts = await query<{ n: number }>(
        `select count(*)::int as n from alerts where call_id = $1 and category = 'MISSED'`,
        [original],
      );
      assert.equal(alerts[0]?.n, 0);
      if (tick.ok) {
        const kamla = tick.results.find((r) => r.parent_id === "parent_kamla");
        const actions = kamla && "ladder" in kamla ? kamla.ladder?.actions ?? [] : [];
        assert.equal(actions.includes("escalated"), false);
        assert.ok(actions.some((a) => a.startsWith("redial_")));
      }
    } finally {
      globalThis.fetch = originalFetch;
      delete process.env.BOLNA_API_KEY;
      delete process.env.CALL_BUDGET_DIALS_DAILY;
    }
  });
});
