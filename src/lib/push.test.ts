import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "./db/client";
import { seed } from "./db/seed";
import { gateOutbound } from "./outbound";
import { savePushSubscription, sendPushToFamily } from "./push";
import { notifyAlert } from "./whatsapp/notify";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";
process.env.WHATSAPP_TEMPLATES_APPROVED = "1";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("web push", () => {
  it("uses gateOutbound and mocks when MOCK_WHATSAPP=1", () => {
    process.env.SAATHI_KILL_SWITCH = "0";
    process.env.MOCK_WHATSAPP = "1";
    const mock = gateOutbound("push", "+910000000001");
    assert.equal(mock.ok, true);
    process.env.MOCK_WHATSAPP = "0";
    process.env.ALLOWED_PHONE_NUMBERS = "9999999999";
    const blocked = gateOutbound("push", "+910000000001");
    assert.equal(blocked.ok, false);
    process.env.MOCK_WHATSAPP = "1";
  });

  it("stores a subscription and logs one mock push per child", async () => {
    await seed();
    const saved = await savePushSubscription("parent_kamla", "mock://example-kamla");
    assert.equal(saved.ok, true);
    const first = await sendPushToFamily("parent_kamla", "Act now", "Seene mein dard ho raha hai.", "push_test_1");
    assert.equal(first.ok, true);
    const rows = await query<{ channel: string; status: string }>(
      `select channel, status from outbound_messages where template = 'web_push' and id like '%push_test_1%'`,
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.channel, "push");
    assert.equal(rows[0]?.status, "mock");
    const second = await sendPushToFamily("parent_kamla", "Act now", "again", "push_test_1");
    assert.equal(second.results[0]?.status, "duplicate");
  });

  it("sends a mock push when an alert is raised", async () => {
    await seed();
    await notifyAlert("parent_kamla", {
      id: "alert_push_probe",
      quote: "Seene mein dard ho raha hai.",
      created_at: "2026-10-18T08:33:00+05:30",
    });
    const n = await query<{ n: number }>(
      `select count(*)::int as n from outbound_messages where channel = 'push' and id like '%alert_alert_push_probe%'`,
    );
    assert.equal(n[0]?.n, 1);
  });
});
