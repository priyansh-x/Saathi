import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { callNeedsBolnaHydrate } from "./execution";
import { bolnaTotalCost } from "./webhook";

describe("Bolna execution hydrate", () => {
  it("pulls while the desk still has an open call", () => {
    assert.equal(callNeedsBolnaHydrate({ status: "in_progress", ended_at: null }), true);
    assert.equal(callNeedsBolnaHydrate({ status: "failed", ended_at: null }), true);
    assert.equal(
      callNeedsBolnaHydrate({ status: "completed", ended_at: "2026-10-20T08:00:00+05:30", duration_sec: 77 }),
      false,
    );
  });

  it("reads Bolna total_cost in cents", () => {
    assert.equal(bolnaTotalCost({ total_cost: 9 }), 9);
    assert.equal(bolnaTotalCost({ cost_breakdown: { total_cost_to_deduct: 0.577 } }), 0.577);
    assert.equal(bolnaTotalCost({}), null);
  });
});
