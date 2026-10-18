import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeSession, encodeSession } from "./session";
import { startEmailSignIn, validEmail } from "./magic";

process.env.MOCK_WHATSAPP = "1";
process.env.MOCK_BOLNA = "1";

describe("email sign-in", () => {
  it("accepts a simple address", () => {
    assert.equal(validEmail("Ananya@Example.com"), true);
    assert.equal(validEmail("nope"), false);
  });

  it("issues a local session when mocks are on, without sending mail", async () => {
    const result = await startEmailSignIn("ananya@example.com");
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.mode, "mock");
    const session = decodeSession(result.token);
    assert.equal(session?.email, "ananya@example.com");
  });

  it("round-trips a signed session", () => {
    const token = encodeSession("rohit@example.com", 1_700_000_000_000);
    const session = decodeSession(token, 1_700_000_000_000);
    assert.equal(session?.email, "rohit@example.com");
    assert.equal(decodeSession(token, 1_800_000_000_000), null);
    assert.equal(decodeSession("tampered." + token.split(".")[1]), null);
  });
});
