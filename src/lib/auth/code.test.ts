import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";
import { decodeSession } from "./session";
import { countRecentCodes, hashSignInCode, issueSignInCode, listMockPendingCodes, persistSignInCode, mintSignInCode, verifySignInCode } from "./code";
import { setEnv } from "@/lib/test/env";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.MOCK_EMAIL = "1";
process.env.ALLOWED_EMAILS = "pilot@example.com";
process.env.SESSION_SECRET = "test-session-secret-for-codes-at-least-32ch";
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_ANON_KEY;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

before(async () => {
  await seed();
});

async function resetCodes() {
  await query("delete from auth_codes");
  process.env.ALLOWED_EMAILS = "pilot@example.com";
}

after(async () => {
  await closeDb();
});

describe("sign-in codes", () => {
  it("stores a hash, returns a 6-digit code, and verifies within 10 minutes", async () => {
    await resetCodes();
    const issued = await issueSignInCode("pilot@example.com");
    assert.equal(issued.ok, true);
    if (!issued.ok) return;
    assert.match(issued.code, /^\d{6}$/);
    assert.equal(issued.plainForOps, true);
    const session = await verifySignInCode("pilot@example.com", issued.code);
    assert.ok(session);
    assert.equal(decodeSession(session)?.email, "pilot@example.com");
  });

  it("refuses a sixth try and ignores a wrong code", async () => {
    await resetCodes();
    const issued = await issueSignInCode("pilot@example.com");
    assert.equal(issued.ok, true);
    if (!issued.ok) return;
    for (let i = 0; i < 5; i++) {
      const miss = await verifySignInCode("pilot@example.com", "000000");
      assert.equal(miss, null);
    }
    const locked = await verifySignInCode("pilot@example.com", issued.code);
    assert.equal(locked, null);
  });

  it("refuses addresses off ALLOWED_EMAILS", async () => {
    const blocked = await issueSignInCode("stranger@example.com");
    assert.equal(blocked.ok, false);
  });

  it("lists pending mock codes only for allowlisted emails", async () => {
    await resetCodes();
    const issued = await issueSignInCode("pilot@example.com");
    assert.equal(issued.ok, true);
    if (!issued.ok) return;
    const rows = await listMockPendingCodes();
    assert.ok(rows.some((row) => row.email === "pilot@example.com" && row.code === issued.code));
    assert.ok(rows.every((row) => row.email === "pilot@example.com"));
  });

  it("rate-limits issuing to five codes per ten minutes even after a cold start", async () => {
    await resetCodes();
    process.env.ALLOWED_EMAILS = "pilot@example.com,rate@example.com";
    for (let i = 0; i < 5; i++) {
      const issued = await issueSignInCode("rate@example.com");
      assert.equal(issued.ok, true);
    }
    const blocked = await issueSignInCode("rate@example.com");
    assert.equal(blocked.ok, false);
  });

  it("refuses an expired code and a wrong code of the same length", async () => {
    await resetCodes();
    const issued = await issueSignInCode("pilot@example.com");
    assert.equal(issued.ok, true);
    if (!issued.ok) return;
    const wrong = issued.code === "123456" ? "654321" : "123456";
    assert.equal(await verifySignInCode("pilot@example.com", wrong), null);
    const { query } = await import("@/lib/db/client");
    await query(`update auth_codes set expires_at = $2 where email = $1`, [
      "pilot@example.com",
      "2000-01-01T00:00:00+00:00",
    ]);
    assert.equal(await verifySignInCode("pilot@example.com", issued.code), null);
  });

  it("does not store code_plain in production even with MOCK_EMAIL=1", async () => {
    await resetCodes();
    const prev = process.env.NODE_ENV;
    setEnv("NODE_ENV", "production");
    process.env.ALLOWED_EMAILS = "pilot@example.com,prod@example.com";
    try {
      const issued = await issueSignInCode("prod@example.com");
      assert.equal(issued.ok, true);
      if (!issued.ok) return;
      assert.equal(issued.plainForOps, false);
      const { query } = await import("@/lib/db/client");
      const rows = await query<{ code_plain: string | null }>(
        `select code_plain from auth_codes where email = $1 order by created_at desc limit 1`,
        ["prod@example.com"],
      );
      assert.equal(rows[0]?.code_plain, null);
    } finally {
      setEnv("NODE_ENV", prev);
    }
  });

  it("does not count codes issued 11 minutes ago against the issue cap", async () => {
    await resetCodes();
    process.env.ALLOWED_EMAILS = "pilot@example.com,aged@example.com";
    const aged = Date.now() - 11 * 60 * 1000;
    for (let i = 0; i < 5; i++) {
      const saved = await persistSignInCode("aged@example.com", mintSignInCode(), aged + i);
      assert.equal(saved.ok, true);
    }
    assert.equal(await countRecentCodes("aged@example.com"), 0);
    const issued = await issueSignInCode("aged@example.com");
    assert.equal(issued.ok, true);
  });

  it("ignores a pre-migration row with null issued_at and verifies the fresh code", async () => {
    await resetCodes();
    process.env.ALLOWED_EMAILS = "pilot@example.com,legacy@example.com";
    const now = Date.now();
    await query(
      `insert into auth_codes (id, email, code_hash, expires_at, tries, created_at, issued_at)
       values ($1,$2,$3,$4,0,$5,null)`,
      [
        "code_legacy_null_issued",
        "legacy@example.com",
        hashSignInCode("legacy@example.com", "111111"),
        new Date(now + 10 * 60 * 1000).toISOString().replace("Z", "+00:00"),
        "2026-10-01T08:00:00+05:30",
      ],
    );
    const issued = await persistSignInCode("legacy@example.com", mintSignInCode());
    assert.equal(issued.ok, true);
    if (!issued.ok) return;
    const session = await verifySignInCode("legacy@example.com", issued.code);
    assert.ok(session);
    assert.equal(decodeSession(session)?.email, "legacy@example.com");
  });

  it("verifies the later code when two share the same created_at minute", async () => {
    await resetCodes();
    process.env.ALLOWED_EMAILS = "pilot@example.com,same-minute@example.com";
    const now = Date.now();
    const first = await persistSignInCode("same-minute@example.com", mintSignInCode(), now);
    const second = await persistSignInCode("same-minute@example.com", mintSignInCode(), now + 1);
    assert.equal(first.ok && second.ok, true);
    if (!first.ok || !second.ok) return;
    const { query } = await import("@/lib/db/client");
    await query(`update auth_codes set created_at = $2 where email = $1`, [
      "same-minute@example.com",
      "2026-10-19T08:30:00+05:30",
    ]);
    const session = await verifySignInCode("same-minute@example.com", second.code);
    assert.ok(session);
    assert.equal(decodeSession(session)?.email, "same-minute@example.com");
  });

  it("accepts a Supabase email OTP when our hashed code is different", async () => {
    await resetCodes();
    const issued = await issueSignInCode("pilot@example.com");
    assert.equal(issued.ok, true);
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-test-key";
    const original = globalThis.fetch;
    globalThis.fetch = (async () => new Response("{}", { status: 200 })) as typeof fetch;
    try {
      const session = await verifySignInCode("pilot@example.com", "654321");
      assert.ok(session);
      assert.equal(decodeSession(session)?.email, "pilot@example.com");
    } finally {
      globalThis.fetch = original;
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;
    }
  });
});
