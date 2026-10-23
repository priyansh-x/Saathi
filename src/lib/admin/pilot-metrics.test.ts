import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computePilotMetrics, isAnsweredCall, pilotCsv, totalPilotRow } from "./pilot-metrics";

const NOW = new Date("2026-10-23T08:00:00+05:30");

describe("pilot metrics", () => {
  it("counts answered only when completed and duration_sec > 0", () => {
    assert.equal(isAnsweredCall({ started_at: "2026-10-23T08:30:00+05:30", status: "completed", duration_sec: 90 }), true);
    assert.equal(isAnsweredCall({ started_at: "2026-10-23T08:30:00+05:30", status: "completed", duration_sec: 0 }), false);
    assert.equal(isAnsweredCall({ started_at: "2026-10-23T08:30:00+05:30", status: "missed", duration_sec: 12 }), false);
  });

  it("computes enrollment, rates, median, streak, views, and false resolutions for a non-example household", () => {
    const row = computePilotMetrics({
      parentId: "parent_pilot",
      name: "Pilot",
      now: NOW,
      consentAt: "2026-10-20T09:00:00+05:30",
      calls: [
        { started_at: "2026-10-21T08:30:00+05:30", status: "completed", duration_sec: 60 },
        { started_at: "2026-10-22T08:30:00+05:30", status: "completed", duration_sec: 120 },
        { started_at: "2026-10-23T08:30:00+05:30", status: "missed", duration_sec: 0 },
        { started_at: "2026-10-23T08:40:00+05:30", status: "completed", duration_sec: 90 },
      ],
      alerts: [{ falseResolved: true }, { falseResolved: false }],
      views: [
        { at: "2026-10-21T10:00:00+05:30" },
        { at: "2026-10-22T10:00:00+05:30" },
        { at: "2026-10-23T10:00:00+05:30" },
        { at: "2026-10-23T11:00:00+05:30" },
      ],
    });
    assert.equal(row.daysEnrolled, 4);
    assert.equal(row.dials, 4);
    assert.equal(row.answered, 3);
    assert.equal(row.answerRate, 0.75);
    assert.equal(row.medianCallSeconds, 90);
    assert.equal(row.answeredDays, 3);
    assert.equal(row.answeredStreak, 3);
    assert.equal(row.deskViewsPerDay, 1);
    assert.equal(row.alertsRaised, 2);
    assert.equal(row.alertsResolvedFalse, 1);
  });

  it("excludes example households by only computing the rows passed in", () => {
    const live = computePilotMetrics({
      parentId: "parent_live",
      name: "Live",
      now: NOW,
      consentAt: "2026-10-23T08:00:00+05:30",
      calls: [{ started_at: "2026-10-23T08:30:00+05:30", status: "completed", duration_sec: 40 }],
      alerts: [],
      views: [],
    });
    const totals = totalPilotRow([live]);
    assert.equal(totals.dials, 1);
    assert.equal(totals.parentId, "totals");
    assert.equal(totals.name, "Totals");
  });

  it("writes a CSV with a totals row", () => {
    const live = computePilotMetrics({
      parentId: "parent_live",
      name: "Live",
      now: NOW,
      consentAt: "2026-10-22T08:00:00+05:30",
      calls: [{ started_at: "2026-10-23T08:30:00+05:30", status: "completed", duration_sec: 40 }],
      alerts: [],
      views: [{ at: "2026-10-23T09:00:00+05:30" }],
    });
    const csv = pilotCsv([live, totalPilotRow([live])]);
    assert.match(csv, /^parent_id,name,/);
    assert.match(csv, /parent_live,Live,/);
    assert.match(csv, /totals,Totals,/);
  });
});
