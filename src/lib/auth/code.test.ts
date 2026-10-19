import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";
import { decodeSession } from "./session";
import { issueSignInCode, listMockPendingCodes, verifySignInCode } from "./code";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "0";
process.env.MOCK_EMAIL = "1";
process.env.ALLOWED_EMAILS = "pilot@example.com";
process.env.SESSION_SECRET = "test-session-secret-for-codes-at-least-32ch";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("sign-in codes", () => {
  it("stores a hash, returns a 6-digit code, and verifies within 10 minutes", async () => {
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
    const issued = await issueSignInCode("pilot@example.com");
    assert.equal(issued.ok, true);
    if (!issued.ok) return;
    const rows = await listMockPendingCodes();
    assert.ok(rows.some((row) => row.email === "pilot@example.com" && row.code === issued.code));
    assert.ok(rows.every((row) => row.email === "pilot@example.com"));
  });

  it("rate-limits issuing to five codes per ten minutes even after a cold start", async () => {
    process.env.ALLOWED_EMAILS = "pilot@example.com,rate@example.com";
    for (let i = 0; i < 5; i++) {
      const issued = await issueSignInCode("rate@example.com");
      assert.equal(issued.ok, true);
    }
    const blocked = await issueSignInCode("rate@example.com");
    assert.equal(blocked.ok, false);
  });

  it("refuses an expired code and a wrong code of the same length", async () => {
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
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
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
      process.env.NODE_ENV = prev;
    }
  });
});
