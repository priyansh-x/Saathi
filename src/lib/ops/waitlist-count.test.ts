import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  allowWaitlistAttempt,
  isHoneypot,
  resetWaitlistRateLimit,
  waitlistUnavailable,
} from "../../../landing/lib/waitlist-core";
import { waitlistSignupCount } from "./waitlist-count";

describe("landing waitlist gates", () => {
  it("honeypot, production 503 without secrets, and 5 per minute per IP", () => {
    assert.equal(isHoneypot("acme"), true);
    assert.equal(isHoneypot(""), false);
    assert.equal(waitlistUnavailable({ NODE_ENV: "production" }), true);
    assert.equal(
      waitlistUnavailable({
        NODE_ENV: "production",
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "secret",
      }),
      false,
    );
    assert.equal(waitlistUnavailable({ NODE_ENV: "development" }), false);
    resetWaitlistRateLimit();
    for (let i = 0; i < 5; i++) assert.equal(allowWaitlistAttempt("1.1.1.1"), true);
    assert.equal(allowWaitlistAttempt("1.1.1.1"), false);
    assert.equal(allowWaitlistAttempt("2.2.2.2"), true);
  });

  it("counts waitlist rows only and never returns contacts", async () => {
    const prev = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY };
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "super-secret-service-role";
    try {
      const n = await waitlistSignupCount(async () => {
        return new Response(null, { status: 200, headers: { "content-range": "0-0/4" } });
      });
      assert.equal(n, 4);
      const missing = await waitlistSignupCount(async () => new Response(null, { status: 500 }));
      assert.equal(missing, null);
    } finally {
      if (prev.url) process.env.SUPABASE_URL = prev.url;
      else delete process.env.SUPABASE_URL;
      if (prev.key) process.env.SUPABASE_SERVICE_ROLE_KEY = prev.key;
      else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    }
  });
});
