import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";
import { logError, recentErrors, scrubContext, scrubPii } from "@/lib/log-error";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("logError", () => {
  it("scrubs phone numbers and names from the message and drops them from context", async () => {
    const raw = "Failed for Kamla Sharma at +919876543210 कमला";
    assert.doesNotMatch(scrubPii(raw), /Kamla/);
    assert.doesNotMatch(scrubPii(raw), /98765/);
    assert.doesNotMatch(scrubPii(raw), /कमला/);
    const ctx = scrubContext({
      parent_id: "parent_abc",
      phone: "+919876543210",
      name: "Kamla Sharma",
      transcript: "secret",
    });
    assert.equal(ctx.parent_id, "parent_abc");
    assert.equal("phone" in ctx, false);
    assert.equal("name" in ctx, false);
    assert.equal("transcript" in ctx, false);

    await logError("tools.raise_alert", new Error(raw), {
      parent_id: "parent_abc",
      phone: "+919876543210",
      name: "Rohit Sharma",
    });
    const rows = await recentErrors(1);
    assert.equal(rows[0]?.where_at, "tools.raise_alert");
    assert.doesNotMatch(rows[0]?.message || "", /Kamla|Rohit|98765|कमला/);
    assert.doesNotMatch(rows[0]?.context || "", /98765|Rohit|Kamla/);
    const stored = await query<{ n: number }>(`select count(*)::int as n from error_events`);
    assert.ok((stored[0]?.n ?? 0) >= 1);
  });
});
