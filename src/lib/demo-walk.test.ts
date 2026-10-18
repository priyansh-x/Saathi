import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { WALK_COPY, exampleWhatsappPreviews } from "./demo-walk";

describe("demo walkthrough previews", () => {
  it("keeps English and Hindi walk keys identical", () => {
    assert.deepEqual(Object.keys(WALK_COPY.en).sort(), Object.keys(WALK_COPY.hi).sort());
  });

  it("renders EXAMPLE family and neighbour copy from the live templates", () => {
    const previews = exampleWhatsappPreviews();
    assert.match(previews.safety_en, /Act now/);
    assert.match(previews.safety_en, /Kamla/);
    assert.match(previews.safety_hi, /अभी देखें/);
    assert.match(previews.responder_hi, /दरवाज़े/);
    assert.match(previews.ack_en, /Rohit is on it/);
    assert.match(previews.missed_soft_en, /No answer yet/);
    assert.match(previews.neighbour_missed_en, /morning calls/);
  });
});
