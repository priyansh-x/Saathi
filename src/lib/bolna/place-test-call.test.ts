import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "../db/client";
import { seed } from "../db/seed";
import { placeTestCall } from "./place";
import { TEST_CALL_REUSE_MS, reuseRecentPlacedCall } from "./recent-call";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.CALL_PROVIDER = "simulated";
process.env.SAATHI_KILL_SWITCH = "0";

const PARENT = "parent_test_dedupe";
const CALL_ID = "call_test_dedupe_recent";

before(async () => {
  await seed();
});

after(async () => {
  await wipeParent();
  await closeDb();
});

async function wipeParent() {
  await query(`delete from outbound_messages where parent_id = $1`, [PARENT]);
  await query(`delete from dose_logs where parent_id = $1`, [PARENT]);
  await query(`delete from call_attempts where call_id in (select id from calls where parent_id = $1)`, [PARENT]);
  await query(`delete from webhook_events where execution_id in (select id from calls where parent_id = $1)`, [PARENT]);
  await query(`delete from alert_events where alert_id in (select id from alerts where parent_id = $1)`, [PARENT]);
  await query(`delete from alerts where parent_id = $1`, [PARENT]);
  await query(`delete from memory_notes where parent_id = $1`, [PARENT]);
  await query(`delete from calls where parent_id = $1`, [PARENT]);
  await query(`delete from parents where id = $1`, [PARENT]);
}

async function ensureParent() {
  await wipeParent();
  await query(`insert into parents values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [
    PARENT,
    "Dedupe Parent",
    "Dedupe",
    "Delhi",
    "Asia/Kolkata",
    "+910000000099",
    "hi",
    "08:00",
    false,
    false,
    true,
  ]);
}

describe("placeTestCall 60-second guard", () => {
  it("returns the existing call instead of placing another within 60 seconds", async () => {
    await ensureParent();
    const clock = new Date();
    const startedAt = new Date(clock.getTime() - 5_000).toISOString();
    await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
      CALL_ID,
      PARENT,
      startedAt,
      null,
      null,
      "in_progress",
      null,
      null,
      null,
      null,
      null,
      null,
      CALL_ID,
      true,
    ]);

    const reused = await reuseRecentPlacedCall(PARENT, clock);
    assert.equal(reused?.execution_id, CALL_ID);

    const placed = await placeTestCall(PARENT, clock);
    assert.equal(placed.ok, true);
    if (placed.ok) assert.equal(placed.execution_id, CALL_ID);

    const again = await placeTestCall(PARENT, new Date(clock.getTime() + 140));
    assert.equal(again.ok, true);
    if (again.ok) assert.equal(again.execution_id, CALL_ID);

    const count = await query<{ n: number }>(
      `select count(*)::int as n from calls where parent_id = $1`,
      [PARENT],
    );
    assert.equal(count[0]?.n, 1);

    const later = await reuseRecentPlacedCall(PARENT, new Date(clock.getTime() + TEST_CALL_REUSE_MS));
    assert.equal(later, null);
  });
});
