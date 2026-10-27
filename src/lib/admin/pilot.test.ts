import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";
import { resolveAlert } from "@/lib/db/queries";
import { loadPilotMetrics } from "./pilot";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("pilot dashboard load", () => {
  it("ignores EXAMPLE Kamla and scores a live household on example numbers", async () => {
    await query(`insert into parents values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [
      "parent_pilot_live",
      "Pilot Parent",
      "Pilot",
      "Delhi",
      "Asia/Kolkata",
      "+919999999999",
      "hi",
      "08:00",
      false,
      false,
      false,
    ]);
    await query(`update parents set consent_status = 'given', consent_at = $2 where id = $1`, [
      "parent_pilot_live",
      "2026-10-21T08:00:00+05:30",
    ]);
    await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
      "call_pilot_ans",
      "parent_pilot_live",
      "2026-10-23T08:30:00+05:30",
      "2026-10-23T08:32:00+05:30",
      90,
      "completed",
      null,
      null,
      null,
      null,
      null,
      null,
      "call_pilot_ans",
      false,
    ]);
    await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
      "call_pilot_miss",
      "parent_pilot_live",
      "2026-10-22T08:30:00+05:30",
      "2026-10-22T08:31:00+05:30",
      0,
      "missed",
      null,
      null,
      null,
      null,
      null,
      null,
      "call_pilot_miss",
      false,
    ]);
    await query(`insert into alerts values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [
      "alert_pilot_false",
      "parent_pilot_live",
      "call_pilot_ans",
      "FALL",
      "look",
      "Bathroom mein phisal gayi.",
      "2026-10-23T08:33:00+05:30",
      null,
      null,
      null,
      false,
      "mid_call",
      false,
    ]);
    await resolveAlert("alert_pilot_false", "child@example.com", "resolved_false");
    await query(`insert into desk_views (id, parent_id, member_id, at) values ($1,$2,$3,$4)`, [
      "dv_pilot_1",
      "parent_pilot_live",
      null,
      "2026-10-23T09:00:00+05:30",
    ]);
    try {
      const { rows, totals } = await loadPilotMetrics(new Date("2026-10-23T12:00:00+05:30"));
      assert.equal(rows.some((r) => r.parentId === "parent_kamla"), false);
      const live = rows.find((r) => r.parentId === "parent_pilot_live");
      assert.ok(live);
      assert.equal(live?.dials, 2);
      assert.equal(live?.answered, 1);
      assert.equal(live?.alertsRaised, 1);
      assert.equal(live?.alertsResolvedFalse, 1);
      assert.ok(live?.deskViewsPerDay > 0);
      assert.equal(totals.dials, live?.dials);
    } finally {
      await query(`delete from desk_views where parent_id = 'parent_pilot_live'`);
      await query(`delete from alert_events where alert_id like 'alert_pilot%'`);
      await query(`delete from alerts where parent_id = 'parent_pilot_live'`);
      await query(`delete from calls where parent_id = 'parent_pilot_live'`);
      await query(`delete from parents where id = 'parent_pilot_live'`);
    }
  });
});
