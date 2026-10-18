import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "../db/client";
import { seed } from "../db/seed";
import { lastCallSummary, promptVariables } from "./summary";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("call memory", () => {
  it("passes at most three post-consent calls, capped at 600 characters", async () => {
    const memory = await lastCallSummary("parent_kamla");
    assert.notEqual(memory, "first call");
    assert.ok(memory.length <= 600);
    const days = memory.match(/\d{4}-\d{2}-\d{2}/g) ?? [];
    assert.ok(days.length <= 3);
    const vars = await promptVariables("parent_kamla");
    assert.equal(typeof vars.call_memory, "string");
    assert.equal(vars.call_memory, vars.last_call_summary);
    assert.equal(Object.values(vars).every((v) => typeof v === "string"), true);
  });

  it("never includes calls from before consent was given", async () => {
    await query(`update parents set consent_at = '2026-10-17T08:12:00+05:30' where id = 'parent_kamla'`);
    const memory = await lastCallSummary("parent_kamla");
    const days = memory.match(/\d{4}-\d{2}-\d{2}/g) ?? [];
    for (const day of days) {
      assert.ok(day >= "2026-10-17");
    }
    await query(`update parents set consent_status = 'pending', consent_at = null where id = 'parent_kamla'`);
    assert.equal(await lastCallSummary("parent_kamla"), "first call");
  });
});
