import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AlertRow, CallRow, DoseLog } from "@/lib/db/types";
import { dayAlerts, dayStatus, daysInMonth, monthGrid, monthStats, monthTitle, shiftMonth, weekdayInitials } from "@/lib/history";

const call = (id: string, started_at: string, status: CallRow["status"]) => ({ id, started_at, status }) as CallRow;
const alert = (id: string, created_at: string, call_id: string | null = null) => ({ id, created_at, call_id }) as AlertRow;
const dose = (medicine_id: string, schedule_date: string, status: DoseLog["status"]) =>
  ({ medicine_id, schedule_date, status }) as DoseLog;

describe("month calendar", () => {
  it("shifts months across year ends", () => {
    assert.equal(shiftMonth("2026-01", -1), "2025-12");
    assert.equal(shiftMonth("2026-12", 1), "2027-01");
    assert.equal(shiftMonth("2026-11", 0), "2026-11");
  });

  it("knows month lengths, leap Februaries included", () => {
    assert.equal(daysInMonth("2026-11"), 30);
    assert.equal(daysInMonth("2028-02"), 29);
    assert.equal(daysInMonth("2026-02"), 28);
  });

  it("lays out Monday-first weeks padded to whole rows", () => {
    // 1 Nov 2026 is a Sunday: six blanks, then the 1st in the last column.
    const grid = monthGrid("2026-11");
    assert.equal(grid.length % 7, 0);
    assert.deepEqual(grid.slice(0, 7), [null, null, null, null, null, null, "2026-11-01"]);
    assert.equal(grid.filter(Boolean).length, 30);
  });

  it("titles and weekday heads in both languages", () => {
    assert.equal(monthTitle("2026-11", "en"), "November 2026");
    assert.equal(monthTitle("2026-11", "hi"), "नवंबर 2026");
    assert.equal(weekdayInitials("en").length, 7);
    assert.equal(weekdayInitials("hi").length, 7);
  });

  it("an answered call wins the day over a missed retry", () => {
    assert.equal(dayStatus([call("a", "2026-11-03T08:30:00+05:30", "missed"), call("b", "2026-11-03T09:00:00+05:30", "completed")]), "answered");
    assert.equal(dayStatus([call("a", "2026-11-03T08:30:00+05:30", "missed")]), "missed");
    assert.equal(dayStatus([call("a", "2026-11-03T08:30:00+05:30", "no_conversation")]), "skipped");
    assert.equal(dayStatus([]), "none");
  });

  it("counts an alert on its day or on that day's call", () => {
    const calls = [call("c1", "2026-11-03T08:30:00+05:30", "completed")];
    const alerts = [alert("a1", "2026-11-04T00:10:00+05:30", "c1"), alert("a2", "2026-11-05T09:00:00+05:30")];
    assert.deepEqual(dayAlerts(alerts, calls, "2026-11-03").map((a) => a.id), ["a1"]);
    assert.deepEqual(dayAlerts(alerts, calls, "2026-11-05").map((a) => a.id), ["a2"]);
  });

  it("month stats skip future days and days before the records start", () => {
    const calls = [
      call("c1", "2026-11-02T08:30:00+05:30", "completed"),
      call("c2", "2026-11-03T08:30:00+05:30", "missed"),
      call("c9", "2026-11-09T08:30:00+05:30", "completed"),
    ];
    const doses = [dose("m1", "2026-11-02", "taken"), dose("m2", "2026-11-02", "taken"), dose("m1", "2026-11-03", "not_taken")];
    const alerts = [alert("a1", "2026-11-03T09:00:00+05:30")];
    const stats = monthStats("2026-11", "2026-11-05", "2026-11-02", calls, doses, alerts, ["m1", "m2"]);
    assert.deepEqual(stats, { answered: 1, placed: 2, taken: 2, expected: 8, alertDays: 1 });
  });
});
