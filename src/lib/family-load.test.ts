import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "./db/client";
import { EXAMPLE_TOKEN } from "./config";
import { EXAMPLE_SEED_REV, ensureSeed, seed } from "./db/seed";
import { deskSnapshotByToken } from "./db/queries";
import { istDayKey } from "./time";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("desk snapshot", () => {
  it("loads the EXAMPLE family in one round trip", async () => {
    const snap = await deskSnapshotByToken(EXAMPLE_TOKEN);
    assert.ok(snap);
    assert.equal(snap?.parent.id, "parent_kamla");
    assert.ok(Array.isArray(snap?.contacts));
    assert.ok(snap?.contacts.some((c) => c.role === "child"));
    assert.ok(Array.isArray(snap?.doses));
    assert.ok(Array.isArray(snap?.weekCalls));
    assert.equal(typeof snap?.neighbourReady, "boolean");
  });

  it("puts today's Kamla call on the desk with a transcript, not an open miss", async () => {
    const snap = await deskSnapshotByToken(EXAMPLE_TOKEN);
    assert.equal(snap?.call?.status, "completed");
    assert.ok(snap?.call?.transcript_json);
    assert.match(snap?.call?.mood_quote || snap?.call?.summary_en || "", /Neend|slept|Amlodipine/i);
    assert.equal(snap?.actAlerts.length, 0);
    assert.ok(!snap?.doses.some((row) => row.status === "not_taken"));
  });

  it("rebuilds EXAMPLE days when the seed rev is stale", async () => {
    const day = istDayKey();
    await query(`update ops_flags set value = 'stale' where key = 'example_seed_rev'`);
    await query(`update calls set status = 'missed', transcript_json = null, mood_quote = null where parent_id = 'parent_kamla' and started_at like $1`, [
      `${day}%`,
    ]);
    await ensureSeed();
    const rev = await query<{ value: string }>(`select value from ops_flags where key = 'example_seed_rev'`);
    assert.equal(rev[0]?.value, EXAMPLE_SEED_REV);
    const today = await query<{ status: string; mood_quote: string | null }>(
      `select status, mood_quote from calls where parent_id = 'parent_kamla' and started_at like $1 order by started_at desc limit 1`,
      [`${day}%`],
    );
    assert.equal(today[0]?.status, "completed");
    assert.match(today[0]?.mood_quote || "", /Neend|theek/i);
  });
});
