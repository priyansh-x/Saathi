import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "./db/client";
import { seed } from "./db/seed";
import { notifyAlert, sendDailyBriefing } from "./whatsapp/notify";
import { acceptInvite, canDeleteFamily, childrenFor, createInvite, MAX_FAMILY_MEMBERS } from "./members";

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

describe("family members", () => {
  it("lets the first child invite up to two others, and only the first can delete", async () => {
    assert.equal(await canDeleteFamily("parent_kamla", "rohit@example.invalid"), true);
    assert.equal(await canDeleteFamily("parent_kamla", "other@example.com"), false);
    assert.equal(await canDeleteFamily("parent_kamla", null), true);

    const invite = await createInvite("parent_kamla", "Rohit Sharma");
    const joined = await acceptInvite(invite.token, {
      email: "priya@example.com",
      name: "Priya Sharma",
      whatsapp: "+910000000003",
    });
    assert.equal(joined.parentId, "parent_kamla");
    const kids = await childrenFor("parent_kamla");
    assert.equal(kids.length, 2);
    assert.equal(kids.filter((k) => k.is_owner).length, 1);

    const second = await createInvite("parent_kamla", "Rohit Sharma");
    await acceptInvite(second.token, {
      email: "amit@example.com",
      name: "Amit Sharma",
      whatsapp: "+910000000004",
    });
    assert.equal((await childrenFor("parent_kamla")).length, MAX_FAMILY_MEMBERS);
    await assert.rejects(() => createInvite("parent_kamla", "Rohit Sharma"), /three members/);

    const briefing = await sendDailyBriefing("parent_kamla", {
      id: "mem_brief",
      mood_quote: "Theek thi.",
      status: "completed",
    });
    assert.equal(briefing.ok, true);
    const alerts = await notifyAlert("parent_kamla", {
      id: "mem_alert",
      quote: "Seene mein dard.",
      created_at: "2026-10-18T08:33:00+05:30",
    });
    const briefCount = await query<{ n: number }>(
      `select count(*)::int as n from outbound_messages where id like 'out_%brief_mem_brief%'`,
    );
    assert.equal(briefCount[0]?.n, 3);
    const alertCount = await query<{ n: number }>(
      `select count(*)::int as n from outbound_messages where id like '%alert_mem_alert%'`,
    );
    assert.ok((alertCount[0]?.n ?? 0) >= 3);
    void alerts;
  });
});
