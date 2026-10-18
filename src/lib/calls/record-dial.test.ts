import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "../db/client";
import { seed } from "../db/seed";
import { runDailyTick } from "../cron/tick";
import { isPreparedCall, postBolnaCall, prepareMorningCall, recordCallPlacement } from "./prepare";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";

const IN_WINDOW = new Date("2026-10-17T03:00:00.000Z");

async function wipeToday() {
  const dayCalls = await query<{ id: string }>(
    `select id from calls where parent_id = 'parent_kamla' and started_at >= '2026-10-17T00:00:00+05:30' and started_at < '2026-10-18T00:00:00+05:30'`,
  );
  for (const call of dayCalls) {
    const alerts = await query<{ id: string }>(`select id from alerts where call_id = $1`, [call.id]);
    for (const alert of alerts) {
      await query(`delete from alert_events where alert_id = $1`, [alert.id]);
    }
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

describe("every dial is recorded", () => {
  it("two ticks mean one dial even if the first row is failed", async () => {
    await seed();
    await wipeToday();
    await recordCallPlacement({
      parentId: "parent_kamla",
      clock: IN_WINDOW,
      executionId: "exec_failed_tick",
      status: "failed",
    });
    const first = await runDailyTick({ now: IN_WINDOW });
    const second = await runDailyTick({ now: IN_WINDOW });
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    const n = await query<{ n: number }>(
      `select count(*)::int as n from calls where parent_id = 'parent_kamla' and started_at like '2026-10-17%'`,
    );
    assert.equal(n[0]?.n, 1);
    if (second.ok) {
      const kamla = second.results.find((r) => r.parent_id === "parent_kamla");
      assert.ok(kamla && ("ladder" in kamla || ("skipped" in kamla && kamla.skipped === "already_called")));
    }
  });

  it("startCall success writes in_progress with execution_id; failure writes failed", async () => {
    await wipeToday();
    const prepared = await prepareMorningCall("parent_kamla", IN_WINDOW);
    assert.equal(isPreparedCall(prepared), true);
    if (!isPreparedCall(prepared)) return;
    const prevKey = process.env.BOLNA_API_KEY;
    process.env.BOLNA_API_KEY = "example-test-key-not-live";
    try {
      const ok = await postBolnaCall(prepared, async () => {
        return new Response(JSON.stringify({ execution_id: "exec_ok_1" }), { status: 200 });
      });
      assert.equal(ok.ok, true);
      const row = await query<{ status: string; bolna_execution_id: string }>(
        `select status, bolna_execution_id from calls where bolna_execution_id = 'exec_ok_1'`,
      );
      assert.equal(row[0]?.status, "in_progress");
      assert.equal(row[0]?.bolna_execution_id, "exec_ok_1");

      await wipeToday();
      const prepared2 = await prepareMorningCall("parent_kamla", IN_WINDOW);
      assert.equal(isPreparedCall(prepared2), true);
      if (!isPreparedCall(prepared2)) return;
      const fail = await postBolnaCall(prepared2, async () => {
        return new Response(JSON.stringify({ message: "no" }), { status: 400 });
      });
      assert.equal(fail.ok, false);
      const failed = await query<{ n: number }>(
        `select count(*)::int as n from calls where parent_id = 'parent_kamla' and status = 'failed' and started_at like '2026-10-17%'`,
      );
      assert.equal(failed[0]?.n, 1);
    } finally {
      if (prevKey) process.env.BOLNA_API_KEY = prevKey;
      else delete process.env.BOLNA_API_KEY;
    }
  });

  it("the daily dial cap blocks a second place even with 0 minutes used", async () => {
    await wipeToday();
    await recordCallPlacement({
      parentId: "parent_kamla",
      clock: IN_WINDOW,
      executionId: "exec_cap",
      status: "failed",
    });
    const again = await prepareMorningCall("parent_kamla", IN_WINDOW);
    assert.equal("ok" in again && again.ok, false);
    if ("ok" in again && !again.ok) assert.equal(again.reason, "already_called");
  });
});
