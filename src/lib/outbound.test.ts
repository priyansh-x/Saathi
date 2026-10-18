import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { gateOutbound } from "./outbound";

describe("allowlist", () => {
  it("allows an exact allowlisted phone", () => {
    process.env.ALLOWED_PHONE_NUMBERS = "+910000000000";
    process.env.MOCK_BOLNA = "0";
    process.env.SAATHI_KILL_SWITCH = "0";
    const decision = gateOutbound("call", "+910000000000");
    assert.equal(decision.ok, true);
  });

  it("mocks web push when WhatsApp mocks are on", () => {
    process.env.SAATHI_KILL_SWITCH = "0";
    process.env.MOCK_WHATSAPP = "1";
    const decision = gateOutbound("push", "+910000000001");
    assert.equal(decision.ok, true);
  });

  it("stops on the kill switch", () => {
    process.env.SAATHI_KILL_SWITCH = "1";
    const decision = gateOutbound("call", "+910000000000");
    assert.equal(decision.ok, false);
    if (!decision.ok) assert.equal(decision.reason, "kill_switch");
    process.env.SAATHI_KILL_SWITCH = "0";
  });
});
