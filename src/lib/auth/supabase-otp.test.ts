import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { consumeSupabaseAuthLink, parseSupabaseAuthLink, sendSupabaseEmailOtp, verifySupabaseEmailOtp } from "./supabase-otp";

describe("supabase email OTP", () => {
  it("posts /otp to send a code", async () => {
    const prev = { url: process.env.SUPABASE_URL, anon: process.env.SUPABASE_ANON_KEY };
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-test-key";
    const urls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    try {
      const sent = await sendSupabaseEmailOtp("adit@gmail.com");
      assert.equal(sent.ok, true);
      assert.equal(urls[0], "https://example.supabase.co/auth/v1/otp");
    } finally {
      globalThis.fetch = original;
      if (prev.url) process.env.SUPABASE_URL = prev.url;
      else delete process.env.SUPABASE_URL;
      if (prev.anon) process.env.SUPABASE_ANON_KEY = prev.anon;
      else delete process.env.SUPABASE_ANON_KEY;
    }
  });

  it("maps supabase mail rate limits to a wait message", async () => {
    const prev = { url: process.env.SUPABASE_URL, anon: process.env.SUPABASE_ANON_KEY };
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-test-key";
    const original = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ code: 429, error_code: "over_email_send_rate_limit", msg: "email rate limit exceeded" }), {
        status: 429,
      })) as typeof fetch;
    try {
      const sent = await sendSupabaseEmailOtp("adit@gmail.com");
      assert.equal(sent.ok, false);
      if (!sent.ok) assert.match(sent.error, /Wait about an hour/);
    } finally {
      globalThis.fetch = original;
      if (prev.url) process.env.SUPABASE_URL = prev.url;
      else delete process.env.SUPABASE_URL;
      if (prev.anon) process.env.SUPABASE_ANON_KEY = prev.anon;
      else delete process.env.SUPABASE_ANON_KEY;
    }
  });

  it("posts /verify for the 6-digit code", async () => {
    const prev = { url: process.env.SUPABASE_URL, anon: process.env.SUPABASE_ANON_KEY };
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-test-key";
    const original = globalThis.fetch;
    globalThis.fetch = (async () => new Response("{}", { status: 200 })) as typeof fetch;
    try {
      assert.equal(await verifySupabaseEmailOtp("adit@gmail.com", "123456"), true);
    } finally {
      globalThis.fetch = original;
      if (prev.url) process.env.SUPABASE_URL = prev.url;
      else delete process.env.SUPABASE_URL;
      if (prev.anon) process.env.SUPABASE_ANON_KEY = prev.anon;
      else delete process.env.SUPABASE_ANON_KEY;
    }
  });
});

describe("supabase magic links", () => {
  it("reads token and type from a verify URL", () => {
    const parsed = parseSupabaseAuthLink(
      "Confirm: https://abc.supabase.co/auth/v1/verify?token=pkce_HASH&type=magiclink&redirect_to=http://localhost:3000",
    );
    assert.deepEqual(parsed, { token: "pkce_HASH", type: "magiclink", accessToken: "" });
  });

  it("reads token_hash and a hash fragment access_token", () => {
    const parsed = parseSupabaseAuthLink(
      "http://localhost:3000/#access_token=eyJhbGciOi.payload.sig&type=magiclink&token_hash=THASH",
    );
    assert.equal(parsed?.token, "THASH");
    assert.equal(parsed?.type, "magiclink");
    assert.equal(parsed?.accessToken, "eyJhbGciOi.payload.sig");
  });

  it("consumes a pasted verify link with token_hash", async () => {
    const prev = { url: process.env.SUPABASE_URL, anon: process.env.SUPABASE_ANON_KEY };
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-test-key";
    const bodies: unknown[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      bodies.push(JSON.parse(String(init?.body || "{}")));
      return new Response(JSON.stringify({ user: { email: "adit@gmail.com" } }), { status: 200 });
    }) as typeof fetch;
    try {
      const consumed = await consumeSupabaseAuthLink(
        "https://example.supabase.co/auth/v1/verify?token=abc123token&type=magiclink&redirect_to=http://localhost:3000",
      );
      assert.deepEqual(consumed, { email: "adit@gmail.com" });
      assert.deepEqual(bodies[0], { type: "magiclink", token_hash: "abc123token" });
    } finally {
      globalThis.fetch = original;
      if (prev.url) process.env.SUPABASE_URL = prev.url;
      else delete process.env.SUPABASE_URL;
      if (prev.anon) process.env.SUPABASE_ANON_KEY = prev.anon;
      else delete process.env.SUPABASE_ANON_KEY;
    }
  });
});
