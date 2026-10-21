import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "../db/client";
import { EXAMPLE_TOKEN } from "../config";
import { deskSnapshotByToken, dosesOnDay, historyDays } from "../db/queries";
import { seed } from "../db/seed";
import { istDayKey } from "../time";
import { placeTestCall } from "./place";
import { processBolnaWebhook } from "./webhook";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.CALL_PROVIDER = "simulated";
process.env.SAATHI_KILL_SWITCH = "0";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("Settings test call reflection", () => {
  it("lands as its own history row with transcript and latest medicine", async () => {
    const day = istDayKey();
    const morning = await query<{ n: number }>(
      `select count(*)::int as n from calls where parent_id = 'parent_kamla' and started_at like $1`,
      [`${day}%`],
    );
    const placed = await placeTestCall("parent_kamla");
    assert.equal(placed.ok, true);
    if (!placed.ok) return;
    const hist = await historyDays("parent_kamla", 30);
    const todayCalls = hist.calls.filter((call) => call.started_at.startsWith(day));
    assert.ok(todayCalls.length >= (morning[0]?.n ?? 0) + 1);
    const testCall = todayCalls.find((call) => call.id === placed.execution_id);
    assert.ok(testCall);
    assert.equal(testCall?.status, "completed");
    assert.ok(testCall?.transcript_json);
    assert.match(testCall?.mood_quote || testCall?.summary_en || "", /Neend|slept|Amlodipine|gol/i);
    const desk = await deskSnapshotByToken(EXAMPLE_TOKEN);
    assert.equal(desk?.call?.id, placed.execution_id);
    const doses = await dosesOnDay("parent_kamla", day);
    assert.ok(doses.some((dose) => dose.status === "taken"));
  });

  it("raises an emergency, push, and desk alert from a test-call chest-pain transcript", async () => {
    const sid = `test_chest_${Date.now()}`;
    const result = await processBolnaWebhook(
      {
        status: "completed",
        conversation_duration: 92,
        transcript: "assistant: Kaisi ho?\nuser: Seene mein dard ho raha hai.\nagent: Amlodipine le li?\nuser: Haan le li.",
        extracted_data: {
          medicines: [{ name: "Amlodipine", status: "taken", said: "le li" }],
          mood_quote: "Seene mein dard ho raha hai.",
          summary_en: "Chest pain. Amlodipine taken.",
        },
        context_details: { recipient_data: { parent_id: "parent_kamla" } },
      },
      sid,
    );
    assert.equal("ok" in result && result.ok, true);
    const call = await query<{ transcript_json: string | null; status: string }>(
      `select transcript_json, status from calls where id = $1`,
      [sid],
    );
    assert.equal(call[0]?.status, "completed");
    assert.match(call[0]?.transcript_json || "", /Seene mein dard/i);
    const alerts = await query<{ quote: string }>(
      `select quote from alerts where call_id = $1 and category = 'EMERGENCY'`,
      [sid],
    );
    assert.equal(alerts.length, 1);
    assert.match(alerts[0]?.quote || "", /Seene|dard|chest/i);
    const push = await query<{ n: number }>(
      `select count(*)::int as n from outbound_messages where channel = 'push' and id like $1`,
      [`%alert_${alerts.length ? "alert_" : ""}${sid}%`],
    );
    const pushAny = await query<{ n: number }>(
      `select count(*)::int as n from outbound_messages where channel = 'push' and body like $1`,
      ["%Seene%"],
    );
    assert.ok((push[0]?.n ?? 0) + (pushAny[0]?.n ?? 0) >= 1);
    const doses = await query<{ status: string }>(
      `select status from dose_logs where call_id = $1 and medicine_id in (select id from medicines where parent_id = 'parent_kamla')`,
      [sid],
    );
    assert.ok(doses.some((row) => row.status === "taken"));
    const hist = await historyDays("parent_kamla", 30);
    assert.ok(hist.calls.some((row) => row.id === sid));
    assert.ok(hist.alerts.some((row) => row.call_id === sid && row.category === "EMERGENCY"));
  });
});
