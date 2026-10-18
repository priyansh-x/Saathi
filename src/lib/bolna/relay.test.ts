import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { relayMessage } from "./tools";
import { closeDb, query } from "../db/client";
import { seed } from "../db/seed";
import { nowIstStamp } from "../time";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("relay_message_to_family", () => {
  it("uses free text in the 24h window and never daily_briefing_good or hard-coded Kamla/08:30", async () => {
    await seed();
    await query(`update parents set first_name = 'Leela', call_time = '09:15', address_term = 'Amma' where id = 'parent_kamla'`);
    await query(`update contacts set last_inbound_at = $1 where parent_id = 'parent_kamla' and role = 'child'`, [
      nowIstStamp(),
    ]);
    await relayMessage({
      call_sid: "relay_open",
      parent_id: "parent_kamla",
      message: "Please buy sugar tablets.",
    });
    const rows = await query<{ template: string; body: string; status: string }>(
      `select template, body, status from outbound_messages where id like '%relay_open%'`,
    );
    assert.ok(rows[0]);
    assert.notEqual(rows[0]?.template, "daily_briefing_good");
    assert.match(rows[0]?.body ?? "", /Please buy sugar tablets/);
    assert.doesNotMatch(rows[0]?.body ?? "", /doing well/);
    assert.equal(rows[0]?.status, "mock_session");
  });

  it("outside the window sends parent_relay from the parent record or email/queued", async () => {
    await seed();
    await query(`update parents set first_name = 'Leela', call_time = '09:15' where id = 'parent_kamla'`);
    await query(`update contacts set last_inbound_at = null where parent_id = 'parent_kamla'`);
    await relayMessage({
      call_sid: "relay_closed",
      parent_id: "parent_kamla",
      message: "Please call this evening.",
    });
    const rows = await query<{ template: string; body: string }>(
      `select template, body from outbound_messages where id like '%relay_closed%'`,
    );
    assert.ok(rows[0]);
    assert.notEqual(rows[0]?.template, "daily_briefing_good");
    assert.equal(rows[0]?.template, "parent_relay");
    assert.match(rows[0]?.body ?? "", /Leela|Amma|Maa/);
    assert.match(rows[0]?.body ?? "", /09:15|9:15/);
    assert.doesNotMatch(rows[0]?.body ?? "", /08:30/);
    assert.doesNotMatch(rows[0]?.body ?? "", /Kamla/);
    assert.match(rows[0]?.body ?? "", /Please call this evening/);
  });
});
