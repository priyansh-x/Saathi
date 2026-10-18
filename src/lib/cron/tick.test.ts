import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "../db/client";
import { seed } from "../db/seed";
import { inMorningWindow, resolveTickClock, runDailyTick } from "./tick";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";

/** 08:30 IST on 17 Oct 2026. */
const IN_WINDOW = new Date("2026-10-17T03:00:00.000Z");
/** 07:00 IST, before Kamla's 08:30 window. */
const BEFORE_WINDOW = new Date("2026-10-17T01:30:00.000Z");

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("daily tick window", () => {
  it("ignores body now and elapsed_min unless MOCK_BOLNA=1", () => {
    const fake = "2020-01-01T00:00:00.000Z";
    const mocked = resolveTickClock({ now: fake, elapsed_min: 99 }, true);
    assert.equal(mocked.now.toISOString(), fake);
    assert.equal(mocked.elapsedMin, 99);
    const live = resolveTickClock({ now: fake, elapsed_min: 99 }, false);
    assert.notEqual(live.now.toISOString(), fake);
    assert.equal(live.elapsedMin, undefined);
    assert.ok(Math.abs(live.now.getTime() - Date.now()) < 5000);
  });

  it("is a half-open IST morning window from call time to 11:00", () => {
    assert.equal(inMorningWindow(IN_WINDOW, "08:30"), true);
    assert.equal(inMorningWindow(BEFORE_WINDOW, "08:30"), false);
  });

  it("places at most one mock call per parent per IST day and skips before the window", async () => {
    await seed();
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
      await query(`delete from calls where id = $1`, [call.id]);
    }
    const early = await runDailyTick({ now: BEFORE_WINDOW });
    assert.equal(early.ok, true);
    if (early.ok) {
      const kamla = early.results.find((r) => r.parent_id === "parent_kamla");
      assert.equal(kamla && "skipped" in kamla ? kamla.skipped : "", "outside_window");
    }
    const first = await runDailyTick({ now: IN_WINDOW });
    assert.equal(first.ok, true);
    const second = await runDailyTick({ now: IN_WINDOW });
    assert.equal(second.ok, true);
    if (second.ok) {
      const kamla = second.results.find((r) => r.parent_id === "parent_kamla");
      assert.ok(kamla && ("ladder" in kamla || ("skipped" in kamla && kamla.skipped === "already_called")));
    }
    const n = await query<{ n: number }>(
      `select count(*)::int as n from calls where parent_id = 'parent_kamla' and started_at like '2026-10-17%'`,
    );
    assert.equal(n[0]?.n, 1, "two ticks must mean one dial");
  });

  it("skips paused and declined households", async () => {
    await query(`update parents set paused = true where id = 'parent_kamla'`);
    const paused = await runDailyTick({ now: IN_WINDOW });
    if (paused.ok) {
      const kamla = paused.results.find((r) => r.parent_id === "parent_kamla");
      assert.equal(kamla && "skipped" in kamla ? kamla.skipped : "", "paused");
    }
    await query(`update parents set paused = false, consent_status = 'declined' where id = 'parent_kamla'`);
    const declined = await runDailyTick({ now: IN_WINDOW });
    if (declined.ok) {
      const kamla = declined.results.find((r) => r.parent_id === "parent_kamla");
      assert.equal(kamla && "skipped" in kamla ? kamla.skipped : "", "declined");
    }
    await query(`update parents set consent_status = 'given' where id = 'parent_kamla'`);
  });
});
