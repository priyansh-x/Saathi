import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb } from "./db/client";
import { EXAMPLE_TOKEN } from "./config";
import { seed } from "./db/seed";
import { deskSnapshotByToken } from "./db/queries";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("desk snapshot", () => {
  it("loads the EXAMPLE family in one round trip", async () => {
    const snap = await deskSnapshotByToken(EXAMPLE_TOKEN);
    assert.ok(snap);
    assert.equal(snap?.parent.id, "parent_kamla");
    assert.ok(Array.isArray(snap?.contacts));
    assert.ok(snap?.contacts.some((c) => c.role === "child"));
    assert.ok(Array.isArray(snap?.doses));
    assert.ok(Array.isArray(snap?.weekCalls));
    assert.equal(typeof snap?.neighbourReady, "boolean");
  });
});
