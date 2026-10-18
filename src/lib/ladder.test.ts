import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "./db/client";
import { seed } from "./db/seed";
import { advanceLadder } from "./ladder";
import { placeMorningCall } from "./bolna/place";
import { parentByToken } from "./db/queries";
import { deleteFamily, leftoverParentRows } from "./delete-family";
import { hasPilotConsent } from "./consent";
import { runMockScenario } from "./bolna/mock-run";
import { ackAlert } from "./whatsapp/ack";
import { istDayKey, istStamp } from "./time";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("missed ladder", () => {
  it("walks T / +10 / +25 / +30 / +45 / +60 and alerts if nobody acked", async () => {
    const result = await runMockScenario("missed_full");
    assert.ok("actions" in result);
    if ("actions" in result) {
      assert.ok(result.actions.includes("soft_notice"));
      assert.ok(result.actions.includes("escalated"));
    }
  });

  it("does not escalate when an attempt was busy", async () => {
    const day = istDayKey();
    const callId = `busy_${Date.now()}`;
    await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
      callId,
      "parent_kamla",
      istStamp(day, 8, 30),
      null,
      0,
      "in_progress",
      null,
      null,
      null,
      null,
      null,
      null,
      callId,
      true,
    ]);
    const result = await advanceLadder({
      parentId: "parent_kamla",
      callId,
      elapsedMin: 60,
      attemptResult: "busy",
    });
    assert.ok(result.actions.includes("skipped_reachable"));
    assert.ok(!result.actions.includes("escalated"));
  });

  it("fills the soft notice from the parent name and address term", async () => {
    await query(`update parents set address_term = 'Amma', first_name = 'Leela', call_time = '09:15', phone = '+910000000000' where id = 'parent_kamla'`);
    try {
      const callId = `ladder_name_${Date.now()}`;
      const day = istDayKey();
      await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
        callId,
        "parent_kamla",
        istStamp(day, 9, 15),
        null,
        0,
        "in_progress",
        null,
        null,
        null,
        null,
        null,
        null,
        callId,
        true,
      ]);
      await advanceLadder({ parentId: "parent_kamla", callId, elapsedMin: 30, attemptResult: "no_answer" });
      const rows = await query<{ body: string }>(
        `select body from outbound_messages where id like $1`,
        [`%soft_${callId}%`],
      );
      assert.match(rows[0]?.body ?? "", /Amma/);
      assert.doesNotMatch(rows[0]?.body ?? "", /Kamla/);
    } finally {
      await query(`update parents set address_term = 'Maa', first_name = 'Kamla', call_time = '08:30', phone = '+910000000000' where id = 'parent_kamla'`);
    }
  });

  it("redials through the provider once per tick, with spacing", async () => {
    const callId = `ladder_redial_${Date.now()}`;
    const day = istDayKey();
    await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
      callId,
      "parent_kamla",
      istStamp(day, 8, 30),
      null,
      0,
      "in_progress",
      null,
      null,
      null,
      null,
      null,
      null,
      callId,
      true,
    ]);
    const placed: string[] = [];
    const place = async (parentId: string) => {
      placed.push(parentId);
      return { ok: true as const, execution_id: `retry_${placed.length}` };
    };
    await advanceLadder(
      { parentId: "parent_kamla", callId, elapsedMin: 60, attemptResult: "no_answer", redial: true },
      { place },
    );
    assert.equal(placed.length, 1);
    await advanceLadder(
      { parentId: "parent_kamla", callId, elapsedMin: 60, attemptResult: "no_answer", redial: true },
      { place },
    );
    assert.equal(placed.length, 2);
  });

  it("does not escalate if someone already acked", async () => {
    const chest = await runMockScenario("chest");
    const alertId = "alert_id" in chest ? chest.alert_id : "";
    const callId = "call_id" in chest && chest.call_id ? chest.call_id : "";
    await ackAlert(alertId, "Rohit");
    const result = await advanceLadder({ parentId: "parent_kamla", callId, elapsedMin: 60 });
    assert.ok(result.actions.includes("skipped_acked"));
    assert.ok(!result.actions.includes("escalated"));
  });
});

describe("pilot gates", () => {
  it("refuses a real dial without consent", async () => {
    process.env.MOCK_BOLNA = "0";
    process.env.SAATHI_KILL_SWITCH = "0";
    await seed();
    const ok = await hasPilotConsent("parent_kamla");
    assert.equal(ok, true);
    await query(`delete from consents where parent_id = 'parent_kamla'`);
    const placed = await placeMorningCall("parent_kamla");
    assert.equal(placed.ok, false);
    if (!placed.ok) assert.equal(placed.reason, "consent");
    process.env.MOCK_BOLNA = "1";
  });

  it("kill switch refuses to place a call", async () => {
    process.env.SAATHI_KILL_SWITCH = "1";
    process.env.MOCK_BOLNA = "1";
    const placed = await placeMorningCall("parent_kamla");
    assert.equal(placed.ok, false);
    if (!placed.ok) assert.equal(placed.reason, "kill_switch");
    process.env.SAATHI_KILL_SWITCH = "0";
  });
});

describe("delete family", () => {
  it("removes every row that names the parent and writes an anonymous deleted event", async () => {
    await query(`insert into parents values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [
      "parent_tmp",
      "Tmp",
      "Tmp",
      "Delhi",
      "Asia/Kolkata",
      "90000 00000",
      "en",
      "08:30",
      false,
      false,
      true,
    ]);
    await query(`insert into magic_links values ($1,$2,$3,$4)`, [
      "tmp-desk",
      "parent_tmp",
      "2099-01-01T00:00:00+05:30",
      false,
    ]);
    await query(`insert into contacts (id, parent_id, role, full_name, first_name, phone, locale, is_example) values ($1,$2,$3,$4,$5,$6,$7,$8)`, [
      "contact_tmp",
      "parent_tmp",
      "child",
      "Tmp Child",
      "Tmp",
      "90000 00001",
      "en",
      false,
    ]);
    await deleteFamily("parent_tmp");
    const leftover = await leftoverParentRows("parent_tmp");
    assert.equal(Object.values(leftover).every((n) => n === 0), true);
    const events = await query<{ kind: string }>(`select kind from deleted_events where kind = 'family_deleted'`);
    assert.ok(events.length >= 1);
    assert.equal(await parentByToken("tmp-desk"), null);
  });
});
