import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";
import { recordDeskView } from "./desk-view";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";

const T0 = new Date("2026-10-23T04:00:00.000Z");

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("desk views", () => {
  it("inserts once then debounces for 30 minutes per parent", async () => {
    await query(`delete from desk_views where parent_id = 'parent_kamla'`);
    const first = await recordDeskView({ parentId: "parent_kamla", now: T0 });
    assert.equal(first.recorded, true);
    const again = await recordDeskView({ parentId: "parent_kamla", now: new Date(T0.getTime() + 5 * 60_000) });
    assert.equal(again.recorded, false);
    if (!again.recorded) assert.equal(again.reason, "server");
    const later = await recordDeskView({
      parentId: "parent_kamla",
      now: new Date(T0.getTime() + 31 * 60_000),
    });
    assert.equal(later.recorded, true);
    await query(`delete from desk_views where parent_id = 'parent_kamla'`);
    const cookie = await recordDeskView({
      parentId: "parent_kamla",
      now: new Date(T0.getTime() + 5 * 60_000),
      cookieStamp: T0.toISOString(),
    });
    assert.equal(cookie.recorded, false);
    if (!cookie.recorded) assert.equal(cookie.reason, "cookie");
  });
});
