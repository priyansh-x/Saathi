import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb } from "../db/client";
import { seed } from "../db/seed";
import { runMockScenario } from "../bolna/mock-run";
import { fixtureButtonMessage, processInboundMessages } from "./inbound";
import { signWhatsappBody, verifyWhatsappSignature } from "./signature";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";
process.env.WHATSAPP_TEMPLATES_APPROVED = "1";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("WhatsApp signature", () => {
  it("accepts a matching X-Hub-Signature-256 and rejects a bad one", () => {
    const secret = "example-app-secret";
    const raw = `{"object":"whatsapp_business_account"}`;
    const good = signWhatsappBody(raw, secret);
    assert.equal(verifyWhatsappSignature(raw, good, secret), true);
    assert.equal(verifyWhatsappSignature(raw, "sha256=deadbeef", secret), false);
    assert.equal(verifyWhatsappSignature(raw, good, ""), false);
  });
});

describe("fixture inbound buttons", () => {
  it("acks the open alert when Rohit's EXAMPLE number taps I'm going", async () => {
    const result = await runMockScenario("chest");
    const alertId = "alert_id" in result ? result.alert_id : "";
    assert.ok(alertId);
    const fixture = fixtureButtonMessage({
      from: "+910000000001",
      title: "I'm going",
      payload: `ack:${alertId}`,
    });
    const messages = fixture.entry.flatMap((e) => e.changes.flatMap((c) => c.value.messages));
    const [ack] = await processInboundMessages(messages);
    assert.equal(ack && "first" in ack && ack.first, true);
    assert.equal(ack && "acked_by" in ack && ack.acked_by, "Rohit");
  });
});
