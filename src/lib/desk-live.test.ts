import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deskLiveStamp } from "@/lib/desk-live";

describe("deskLiveStamp", () => {
  it("changes when a call ends", () => {
    const live = deskLiveStamp({ callId: "c1", status: "in_progress", endedAt: null, alertId: null });
    const done = deskLiveStamp({
      callId: "c1",
      status: "completed",
      endedAt: "2026-10-20T08:34:00+05:30",
      alertId: "a1",
      hasWords: true,
    });
    assert.notEqual(live, done);
  });
});
