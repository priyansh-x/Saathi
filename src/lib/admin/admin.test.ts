import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";
import { runAdminAction } from "./actions";
import { loadAdminHousehold, loadAdminOverview } from "./data";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.MOCK_EMAIL = "1";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("admin data", () => {
  it("loads households, accounts, and a household with calls and people", async () => {
    const overview = await loadAdminOverview();
    assert.ok(overview.households.some((row) => row.id === "parent_kamla"));
    assert.ok(overview.households.some((row) => row.is_example));
    assert.equal(typeof overview.pushN, "number");
    assert.ok(Array.isArray(overview.webhooks));
    assert.ok(Array.isArray(overview.accounts));

    const household = await loadAdminHousehold("parent_kamla");
    assert.ok(household);
    assert.equal(household.parent.full_name.length > 0, true);
    assert.ok(household.contacts.length > 0);
    assert.ok(household.calls.length > 0);
    assert.ok(household.medicines.length > 0);
    for (const call of household.calls) {
      assert.ok(Array.isArray(call.lines));
    }
    assert.equal(await loadAdminHousehold("parent_missing"), null);
  });
});

describe("admin actions", () => {
  it("pauses and resumes a household", async () => {
    const pause = await runAdminAction({ action: "pause", parentId: "parent_kamla", who: "admin-test" });
    assert.equal(pause.ok, true);
    const paused = await query<{ paused: boolean }>(`select paused from parents where id = 'parent_kamla'`);
    assert.equal(paused[0]?.paused, true);
    const resume = await runAdminAction({ action: "resume", parentId: "parent_kamla", who: "admin-test" });
    assert.equal(resume.ok, true);
    const after = await query<{ paused: boolean }>(`select paused from parents where id = 'parent_kamla'`);
    assert.equal(after[0]?.paused, false);
  });

  it("rejects a missing parent and missing alert", async () => {
    const missing = await runAdminAction({ action: "pause", parentId: "parent_nope", who: "admin-test" });
    assert.equal(missing.ok, false);
    if (!missing.ok) assert.equal(missing.error, "unknown_parent");
    const noParent = await runAdminAction({ action: "pause", who: "admin-test" });
    assert.equal(noParent.ok, false);
    const noAlert = await runAdminAction({ action: "ack_alert", parentId: "parent_kamla", who: "admin-test" });
    assert.equal(noAlert.ok, false);
    if (!noAlert.ok) assert.equal(noAlert.error, "missing_alert");
  });
});
