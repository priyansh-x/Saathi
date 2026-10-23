import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AlertRow, CallRow, DoseLog } from "./db/types";
import { dedupeDoses, heroCopy, humanQuote, ringCopy, todayStatus } from "./today";

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

  it("stays scheduled for a new family that has never been called", () => {
    assert.equal(
      todayStatus({
        paused: false,
        call: null,
        doses: [],
        actAlerts: [],
        nowMin: 12 * 60,
        callTimeMin: 8 * 60 + 30,
        neverCalled: true,
      }),
      "scheduled",
    );
  });

  it("stays scheduled when no call was placed, even after the window", () => {
    assert.equal(
      todayStatus({
        paused: false,
        call: null,
        doses: [],
        actAlerts: [],
        nowMin: 12 * 60,
        callTimeMin: 10 * 60,
      }),
      "scheduled",
    );
  });

  it("is calling while a live dial is still open", () => {
    assert.equal(
      todayStatus({
        paused: false,
        call: call("in_progress"),
        doses: [],
        actAlerts: [],
        nowMin: 16 * 60,
        callTimeMin: 8 * 60 + 30,
      }),
      "calling",
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

  it("dedupes medicine rows by medicine id", () => {
    const rows = dedupeDoses([dose("not_asked", "a"), dose("taken", "b")]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.status, "taken");
  });

  it("labels Act now with a chip that is not the look chip", () => {
    const base = {
      callTime: "08:30",
      call: call("completed"),
      doses: [dose("not_taken")],
      alert: actAlert,
      attempts: [],
      neighbourName: "Priya",
      ackedBy: null,
      ackedAt: null,
    };
    const actEn = heroCopy({ ...base, state: "act", lang: "en" });
    const actHi = heroCopy({ ...base, state: "act", lang: "hi" });
    const lookEn = heroCopy({ ...base, state: "look", lang: "en" });
    assert.equal(actEn.chip, "Act now");
    assert.ok(actHi.chip.trim().length > 0);
    assert.notEqual(lookEn.chip, actEn.chip);
    assert.equal(lookEn.chip, "Needs a look");
    const trying = heroCopy({ ...base, state: "trying", lang: "en", alert: null });
    assert.equal(trying.chip, "Trying to reach");
    assert.notEqual(trying.chip, lookEn.chip);
    const late = heroCopy({ ...base, state: "scheduled", lang: "en", call: null, overdue: true });
    assert.match(late.headline, /has not called yet/i);
    const callingEn = heroCopy({ ...base, state: "calling", lang: "en", call: call("in_progress") });
    assert.equal(callingEn.chip, "On the line");
    assert.match(callingEn.headline, /talking with Maa/i);
  });

  it("maps Call now results to family copy", () => {
    assert.match(ringCopy("placed", "en") || "", /placing the call/);
    assert.match(ringCopy("not_allowlisted", "en") || "", /allowlist/);
    assert.match(ringCopy("bolna_unverified", "en") || "", /Verified Numbers/);
    assert.equal(ringCopy("example", "en"), "The example desk does not place a live call. Open your family desk.");
    assert.match(ringCopy("bolna_hours", "en") || "", /calling hours/);
    assert.match(ringCopy("budget", "en") || "", /minutes/);
    assert.equal(ringCopy("wait_7", "en"), "Try again in 7 min.");
    assert.match(ringCopy("wait_7", "hi") || "", /7/);
    assert.equal(ringCopy(undefined, "en"), null);
  });

  it("never treats a system miss line as her words", () => {
    assert.equal(
      humanQuote({
        ...actAlert,
        category: "MISSED",
        source: "ladder",
        quote: "No answer after the morning ladder.",
      }),
      null,
    );
  });
});
