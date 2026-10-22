import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bolnaExecutionId, callNeedsBolnaHydrate } from "./execution";
import { bolnaTotalCost } from "./webhook";

describe("Bolna execution hydrate", () => {
  it("reads execution_id from nested Bolna bodies", () => {
    assert.equal(bolnaExecutionId({ execution_id: "exec_1" }), "exec_1");
    assert.equal(bolnaExecutionId({ message: "done", data: { execution_id: "exec_nested" } }), "exec_nested");
  });

  it("pulls while the desk still has an open call", () => {
    assert.equal(callNeedsBolnaHydrate({ status: "in_progress", ended_at: null }), true);
    assert.equal(callNeedsBolnaHydrate({ id: "fail_parent_x", status: "failed", ended_at: null }), false);
    assert.equal(
      callNeedsBolnaHydrate({
        id: "836e9f0f-0b78-4049-8a40-c8aa38cf28fb",
        status: "completed",
        ended_at: "2026-10-22T10:19:00+05:30",
        duration_sec: 87,
        transcript_json: '[{"speaker":"parent","hi":"ok"}]',
      }),
      false,
    );
    assert.equal(callNeedsBolnaHydrate({ status: "failed", ended_at: null }), true);
    assert.equal(
      callNeedsBolnaHydrate({
        id: "836e9f0f-0b78-4049-8a40-c8aa38cf28fb",
        status: "missed",
        ended_at: "2026-10-21T10:00:00+05:30",
        transcript_json: null,
      }),
      true,
    );
    assert.equal(
      callNeedsBolnaHydrate({
        status: "completed",
        ended_at: "2026-10-20T08:00:00+05:30",
        duration_sec: 77,
        transcript_json: "[]",
      }),
      true,
    );
    assert.equal(
      callNeedsBolnaHydrate({
        status: "completed",
        ended_at: "2026-10-20T08:00:00+05:30",
        duration_sec: 77,
        transcript_json: null,
      }),
      true,
    );
  });

  it("reads Bolna total_cost in cents", () => {
    assert.equal(bolnaTotalCost({ total_cost: 9 }), 9);
    assert.equal(bolnaTotalCost({ cost_breakdown: { total_cost_to_deduct: 0.577 } }), 0.577);
    assert.equal(bolnaTotalCost({}), null);
  });
});
