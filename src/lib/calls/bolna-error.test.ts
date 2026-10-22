import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bolnaErrorText, bolnaPlaceReason } from "./bolna-error";

describe("bolnaPlaceReason", () => {
  it("flags trial verified-number blocks", () => {
    assert.equal(
      bolnaPlaceReason(400, { message: "Trial accounts can only make calls to verified phone numbers." }),
      "bolna_unverified",
    );
    assert.equal(bolnaPlaceReason(400, { message: "Recipient is not a verified number" }), "bolna_unverified");
  });

  it("flags calling-hours guardrails", () => {
    assert.equal(
      bolnaPlaceReason(400, { message: "Call blocked by calling hours guardrail" }),
      "bolna_hours",
    );
  });

  it("keeps a generic Bolna failure for other 400s", () => {
    assert.equal(bolnaPlaceReason(400, { message: "agent_id is required" }), "bolna_error");
    assert.equal(bolnaErrorText({ message: "agent_id is required" }), "agent_id is required");
  });
});
