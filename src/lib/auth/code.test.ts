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

  it("rate-limits issuing to five codes per ten minutes", async () => {
    process.env.ALLOWED_EMAILS = "pilot@example.com,rate@example.com";
    for (let i = 0; i < 5; i++) {
      const issued = await issueSignInCode("rate@example.com");
      assert.equal(issued.ok, true);
    }
    const blocked = await issueSignInCode("rate@example.com");
    assert.equal(blocked.ok, false);
  });
});
