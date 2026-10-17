import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bolnaWebhookAuthorized, toolAuthorized } from "./bolna/auth";
import { bolnaAgentLanguage } from "./bolna/place";
import { parseWhatsappWebhookJson } from "./whatsapp/inbound";

describe("parent language for Bolna", () => {
  it("uses the parent's first listed language, not a hard-coded hi", () => {
    assert.equal(bolnaAgentLanguage("hi,en"), "hi");
    assert.equal(bolnaAgentLanguage("en,hi"), "en");
    assert.equal(bolnaAgentLanguage("  EN ,hi"), "en");
  });
});

describe("WhatsApp webhook JSON", () => {
  it("returns a parse failure for broken JSON instead of throwing", () => {
    const parsed = parseWhatsappWebhookJson("{not json");
    assert.equal(parsed.ok, false);
  });

  it("reads inbound messages from a valid envelope", () => {
    const parsed = parseWhatsappWebhookJson(
      JSON.stringify({ entry: [{ changes: [{ value: { messages: [{ from: "1", type: "text" }] } }] }] }),
    );
    assert.equal(parsed.ok, true);
    if (parsed.ok) assert.equal(parsed.messages[0]?.from, "1");
  });
});

describe("tool api_token", () => {
  it("accepts Bearer, x-api-token, and ?api_token=", () => {
    process.env.MOCK_BOLNA = "1";
    delete process.env.SAATHI_TOOL_TOKEN;
    const token = "dev-tool-token";
    assert.equal(toolAuthorized(new Request("http://local/api/tools/log_medicine", { headers: { authorization: `Bearer ${token}` } })), true);
    assert.equal(toolAuthorized(new Request("http://local/api/tools/log_medicine", { headers: { "x-api-token": token } })), true);
    assert.equal(toolAuthorized(new Request(`http://local/api/tools/log_medicine?api_token=${token}`)), true);
    assert.equal(toolAuthorized(new Request("http://local/api/tools/log_medicine")), false);
  });
});

describe("Bolna webhook secret", () => {
  it("returns 401 semantics when mocks are off and the secret is wrong", () => {
    const prev = {
      mock: process.env.MOCK_BOLNA,
      secret: process.env.BOLNA_WEBHOOK_SECRET,
    };
    process.env.MOCK_BOLNA = "0";
    process.env.BOLNA_WEBHOOK_SECRET = "hook-secret";
    try {
      assert.equal(
        bolnaWebhookAuthorized(
          new Request("http://local/api/webhooks/bolna", { headers: { authorization: "Bearer hook-secret" } }),
        ),
        true,
      );
      assert.equal(
        bolnaWebhookAuthorized(
          new Request("http://local/api/webhooks/bolna", { headers: { authorization: "Bearer wrong" } }),
        ),
        false,
      );
      assert.equal(bolnaWebhookAuthorized(new Request("http://local/api/webhooks/bolna")), false);
    } finally {
      process.env.MOCK_BOLNA = prev.mock;
      if (prev.secret) process.env.BOLNA_WEBHOOK_SECRET = prev.secret;
      else delete process.env.BOLNA_WEBHOOK_SECRET;
    }
  });
});
