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

  it("in mock mode still issues a session for an address off ALLOWED_EMAILS", async () => {
    const prev = process.env.ALLOWED_EMAILS;
    process.env.MOCK_WHATSAPP = "1";
    process.env.ALLOWED_EMAILS = "pilot@example.com";
    try {
      const result = await startEmailSignIn("visitor@example.com");
      assert.equal(result.ok, true);
      if (result.ok) assert.equal(result.mode, "mock");
    } finally {
      process.env.ALLOWED_EMAILS = prev;
    }
  });

  it("when mocks are off, refuses addresses that are not on ALLOWED_EMAILS", async () => {
    const prev = {
      mock: process.env.MOCK_WHATSAPP,
      emails: process.env.ALLOWED_EMAILS,
      url: process.env.SUPABASE_URL,
    };
    process.env.MOCK_WHATSAPP = "0";
    process.env.ALLOWED_EMAILS = "pilot@example.com";
    delete process.env.SUPABASE_URL;
    const urls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    try {
      const blocked = await startEmailSignIn("visitor@example.com");
      assert.equal(blocked.ok, false);
      if (!blocked.ok) assert.match(blocked.error, /Pilot is invite-only for now/);
      assert.equal(urls.length, 0);
      const allowed = await startEmailSignIn("pilot@example.com");
      assert.equal(allowed.ok, false);
      if (!allowed.ok) assert.match(allowed.error, /not configured/);
      assert.equal(urls.length, 0);
    } finally {
      globalThis.fetch = original;
      process.env.MOCK_WHATSAPP = prev.mock;
      process.env.ALLOWED_EMAILS = prev.emails;
      if (prev.url) process.env.SUPABASE_URL = prev.url;
    }
  });

  it("round-trips a signed session", () => {
    const token = encodeSession("rohit@example.com", 1_700_000_000_000);
    const session = decodeSession(token, 1_700_000_000_000);
    assert.equal(session?.email, "rohit@example.com");
    assert.equal(decodeSession(token, 1_800_000_000_000), null);
    assert.equal(decodeSession("tampered." + token.split(".")[1]), null);
  });
});
