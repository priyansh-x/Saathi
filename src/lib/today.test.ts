import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AlertRow, CallRow, DoseLog } from "./db/types";
import { dedupeDoses, todayStatus } from "./today";

function call(status: CallRow["status"]): CallRow {
  return {
    id: "c1",
    parent_id: "p",
    started_at: "2026-10-17T08:32:00+05:30",
    ended_at: "2026-10-17T08:36:00+05:30",
    duration_sec: 240,
    status,
    summary_en: "ok",
    summary_hi: null,
    mood_quote: "Neend theek thi.",
    mood_quote_lang: "hi",
    transcript_json: null,
  };
}

function dose(status: DoseLog["status"], id = "1"): DoseLog {
  return { id, medicine_id: "med_amlo", schedule_date: "2026-10-17", status, said: null, name: "Amlodipine", meal: "after breakfast" };
}

const actAlert: AlertRow = {
  id: "a1",
  parent_id: "p",
  call_id: "c1",
  category: "EMERGENCY",
  level: "act",
  quote: "Seene mein dard ho raha hai.",
  created_at: "2026-10-17T08:33:00+05:30",
  acked_at: null,
  acked_by: null,
  resolved_at: null,
  late: false,
  source: "mid_call",
};

describe("todayStatus", () => {
  it("is scheduled before the call window, never amber", () => {
    assert.equal(
      todayStatus({
        paused: false,
        call: null,
        doses: [],
        actAlerts: [],
        nowMin: 8 * 60,
        callTimeMin: 8 * 60 + 30,
      }),
      "scheduled",
    );
  });

  it("is trying after the window with no call", () => {
    assert.equal(
      todayStatus({
        paused: false,
        call: null,
        doses: [],
        actAlerts: [],
        nowMin: 9 * 60,
        callTimeMin: 8 * 60 + 30,
      }),
      "trying",
    );
  });

  it("is trying while retries are in progress", () => {
    assert.equal(
      todayStatus({
        paused: false,
        call: call("missed"),
        doses: [],
        actAlerts: [],
        nowMin: 9 * 60,
        callTimeMin: 8 * 60 + 30,
      }),
      "trying",
    );
  });

  it("is good after a completed call with doses taken", () => {
    assert.equal(
      todayStatus({
        paused: false,
        call: call("completed"),
        doses: [dose("taken")],
        actAlerts: [],
        nowMin: 9 * 60,
        callTimeMin: 8 * 60 + 30,
      }),
      "good",
    );
  });

  it("is look when a tablet was missed", () => {
    assert.equal(
      todayStatus({
        paused: false,
        call: call("completed"),
        doses: [dose("not_taken")],
        actAlerts: [],
        nowMin: 9 * 60,
        callTimeMin: 8 * 60 + 30,
      }),
      "look",
    );
  });

  it("is act when an Act-now alert is open", () => {
    assert.equal(
      todayStatus({
        paused: false,
        call: call("completed"),
        doses: [dose("taken")],
        actAlerts: [actAlert],
        nowMin: 9 * 60,
        callTimeMin: 8 * 60 + 30,
      }),
      "act",
    );
  });

  it("is paused when the household is paused", () => {
    assert.equal(
      todayStatus({
        paused: true,
        call: null,
        doses: [],
        actAlerts: [],
        nowMin: 8 * 60,
        callTimeMin: 8 * 60 + 30,
      }),
      "paused",
    );
  });

  it("is skipped on a no-conversation day", () => {
    assert.equal(
      todayStatus({
        paused: false,
        call: call("no_conversation"),
        doses: [],
        actAlerts: [],
        nowMin: 9 * 60,
        callTimeMin: 8 * 60 + 30,
      }),
      "skipped",
    );
  });

  it("dedupes medicine rows by medicine and slot", () => {
    const rows = dedupeDoses([dose("not_asked", "a"), dose("taken", "b")]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.status, "taken");
  });
});
