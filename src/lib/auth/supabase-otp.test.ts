import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sendSupabaseEmailOtp, verifySupabaseEmailOtp } from "./supabase-otp";

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
