import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeSession, encodeSession } from "./session";
import { startEmailSignIn, validEmail } from "./magic";

process.env.MOCK_WHATSAPP = "1";
process.env.MOCK_BOLNA = "1";
process.env.MOCK_EMAIL = "1";
process.env.PUBLIC_BASE_URL = "http://127.0.0.1:43147";
process.env.ALLOWED_EMAILS = "ananya@example.com,pilot@example.com";
process.env.OPS_EMAILS = "ops@example.com";
process.env.SESSION_SECRET = "test-session-secret-for-sign-in-at-least-32ch";

describe("email sign-in", () => {
  it("accepts a simple address", () => {
    assert.equal(validEmail("Ananya@Example.com"), true);
    assert.equal(validEmail("nope"), false);
  });

  it("dev localhost still issues a mock session for an allowlisted address", async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    try {
      const result = await startEmailSignIn("ananya@example.com");
      assert.equal(result.ok, true);
      if (!result.ok) return;
      assert.equal(result.mode, "mock");
      const session = decodeSession(result.token);
      assert.equal(session?.email, "ananya@example.com");
    } finally {
      process.env.NODE_ENV = prev;
    }
  });

  it("refuses an address off ALLOWED_EMAILS and OPS_EMAILS", async () => {
    const result = await startEmailSignIn("visitor@example.com");
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /Pilot is invite-only for now/);
  });

  it("production + mocks issues no session for an arbitrary email", async () => {
    const prev = {
      node: process.env.NODE_ENV,
      emails: process.env.ALLOWED_EMAILS,
      ops: process.env.OPS_EMAILS,
      base: process.env.PUBLIC_BASE_URL,
    };
    process.env.NODE_ENV = "production";
    process.env.PUBLIC_BASE_URL = "https://family.example";
    process.env.ALLOWED_EMAILS = "pilot@example.com";
    process.env.OPS_EMAILS = "ops@example.com";
    try {
      const arbitrary = await startEmailSignIn("stranger@example.com");
      assert.equal(arbitrary.ok, false);
      if (!arbitrary.ok) assert.match(arbitrary.error, /not configured/);
      const allowlisted = await startEmailSignIn("pilot@example.com");
      assert.equal(allowlisted.ok, false);
      if (!allowlisted.ok) assert.match(allowlisted.error, /not configured/);
      const ops = await startEmailSignIn("ops@example.com");
      assert.equal(ops.ok, false);
      if (!ops.ok) assert.match(ops.error, /not configured/);
      assert.ok(!("token" in (ops.ok ? ops : {})));
    } finally {
      process.env.NODE_ENV = prev.node;
      process.env.ALLOWED_EMAILS = prev.emails;
      process.env.OPS_EMAILS = prev.ops;
      process.env.PUBLIC_BASE_URL = prev.base;
    }
  });

  it("when mocks are off, refuses addresses that are not on ALLOWED_EMAILS", async () => {
    const prev = {
      mock: process.env.MOCK_WHATSAPP,
      mockEmail: process.env.MOCK_EMAIL,
      emails: process.env.ALLOWED_EMAILS,
      url: process.env.SUPABASE_URL,
      node: process.env.NODE_ENV,
    };
    process.env.MOCK_WHATSAPP = "0";
    process.env.MOCK_EMAIL = "0";
    process.env.NODE_ENV = "test";
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
      process.env.MOCK_EMAIL = prev.mockEmail;
      process.env.ALLOWED_EMAILS = prev.emails;
      process.env.NODE_ENV = prev.node;
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
