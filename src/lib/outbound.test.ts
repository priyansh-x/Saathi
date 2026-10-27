import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { gateOutbound } from "./outbound";

describe("allowlist", () => {
  it("allows an exact allowlisted phone", () => {
    process.env.ALLOWED_PHONE_NUMBERS = "+910000000000";
    process.env.MOCK_BOLNA = "1";
    process.env.SAATHI_KILL_SWITCH = "0";
    const decision = gateOutbound("call", "+910000000000");
    assert.equal(decision.ok, true);
  });

  it("allowlists only env numbers, matching India mobiles without plus-91", () => {
    process.env.ALLOWED_PHONE_NUMBERS = "+919999999999,+919888888888";
    process.env.MOCK_BOLNA = "1";
    process.env.SAATHI_KILL_SWITCH = "0";
    assert.equal(gateOutbound("call", "+919999999999").ok, true);
    assert.equal(gateOutbound("call", "9888888888").ok, true);
    process.env.ALLOWED_EMAILS = "";
    assert.equal(gateOutbound("email", "child@example.com").ok, false);
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
