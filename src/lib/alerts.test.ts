import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AlertRow } from "./db/types";
import { alertLife, sortAlerts, statusPill } from "./alerts";

function alert(partial: Partial<AlertRow>): AlertRow {
  return {
    id: "a",
    parent_id: "p",
    call_id: null,
    category: "EMERGENCY",
    level: "act",
    quote: "Seene mein dard ho raha hai.",
    created_at: "2026-10-17T08:33:00+05:30",
    acked_at: null,
    acked_by: null,
    resolved_at: null,
    late: false,
    source: "mid_call",
    ...partial,
  };
}

describe("alert list", () => {
  it("puts open alerts first", () => {
    const open = alert({ id: "open", created_at: "2026-10-16T08:00:00+05:30" });
    const done = alert({
      id: "done",
      created_at: "2026-10-17T09:00:00+05:30",
      resolved_at: "2026-10-17T09:10:00+05:30",
    });
    assert.deepEqual(
      sortAlerts([done, open]).map((a) => a.id),
      ["open", "done"],
    );
  });

  it("uses words in the status pill", () => {
    const going = alert({ acked_at: "2026-10-17T09:14:00+05:30", acked_by: "Sunita" });
    const pill = statusPill(going, "en");
    assert.match(pill.label, /Sunita/);
    assert.match(pill.label, /going/);
    assert.equal(alertLife(alert({ is_false: true })), "false");
    assert.equal(statusPill(alert({ is_false: true }), "en").label, "False alarm");
  });
});
