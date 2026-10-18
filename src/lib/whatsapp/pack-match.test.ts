import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { relayMessage } from "@/lib/bolna/tools";
import { recordSpokenConsent } from "@/lib/consent";
import { closeDb, query } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";
import { advanceLadder } from "@/lib/ladder";
import { requestNeighbourOptIn } from "@/lib/neighbour";
import { istDayKey, istStamp } from "@/lib/time";
import { sendWeeklyNote } from "@/lib/weekly";
import { escalateUndeliveredAlerts } from "@/lib/whatsapp/delivery";
import { notifyAlert, sendDailyBriefing } from "@/lib/whatsapp/notify";
import { bodyVariables, whatsappTemplatePack } from "@/lib/whatsapp/template-pack";
import { mockLoggedWhatsapp } from "@/lib/whatsapp/send";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

function assertAgainstPack(entry: (typeof mockLoggedWhatsapp)[number]) {
  if (entry.name === "hello_world" || !entry.name) return;
  if (entry.name === "parent_relay" && entry.buttons === 0) return;
  const tpl = whatsappTemplatePack().find((row) => row.name === entry.name && row.language === entry.language);
  assert.ok(tpl, `${entry.name}/${entry.language} missing from pack`);
  assert.equal(entry.vars.length, bodyVariables(tpl.body).length, `${entry.name} var count`);
  assert.equal(entry.buttons, tpl.buttons.length, `${entry.name} buttons`);
}

describe("runtime WhatsApp sends match the pack", () => {
  it("call-site notify/ladder/delivery/consent/neighbour/weekly/relay log pack-faithful payloads", async () => {
    await seed();
    mockLoggedWhatsapp.length = 0;
    const day = istDayKey();
    const callId = `pack_call_${Date.now()}`;
    await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
      callId,
      "parent_kamla",
      istStamp(day, 8, 30),
      null,
      0,
      "missed",
      null,
      null,
      "Theek thi.",
      null,
      null,
      null,
      callId,
      true,
    ]);
    const med = await query<{ id: string; meal: string }>(
      `select id, meal from medicines where parent_id = 'parent_kamla' limit 1`,
    );
    if (med[0]) {
      await query(`insert into dose_logs values ($1,$2,$3,$4,$5,$6,$7,$8)`, [
        `dose_pack_${Date.now()}`,
        "parent_kamla",
        callId,
        med[0].id,
        day,
        "not_taken",
        "khatam",
        true,
      ]);
    }
    await sendDailyBriefing("parent_kamla", { id: callId, mood_quote: "Theek thi.", status: "completed" });
    const missedMed = mockLoggedWhatsapp.filter((row) => row.name === "daily_briefing_missed_med");
    for (const row of missedMed) {
      assert.notEqual(row.vars[2], "Theek thi.");
      if (med[0]?.meal) assert.equal(row.vars[2], med[0].meal);
    }

    await advanceLadder({
      parentId: "parent_kamla",
      callId,
      elapsedMin: 30,
      attemptResult: "no_answer",
      redial: false,
    });
    const soft = mockLoggedWhatsapp.filter((row) => row.name === "missed_call_soft");
    assert.ok(soft[0]);
    assert.notEqual(soft[0]?.vars[1], "4");
    assert.notEqual(soft[0]?.vars[3], soft[0]?.vars[2]);

    await notifyAlert("parent_kamla", {
      id: `alert_pack_${Date.now()}`,
      quote: "Bathroom mein gir gayi.",
      created_at: `${day}T08:33:00+05:30`,
      category: "EMERGENCY",
      level: "act",
    });
    const emergency = mockLoggedWhatsapp.filter((row) => row.name === "safety_alert_emergency");
    assert.ok(emergency[0]);
    assert.notEqual(emergency[0]?.vars[1], "4");

    await requestNeighbourOptIn("parent_kamla");
    await query(
      `update parents set consent_status = 'pending', consent_later_count = 0 where id = 'parent_kamla'`,
    );
    await recordSpokenConsent({ call_sid: callId, parent_id: "parent_kamla", answer: "later" });
    await recordSpokenConsent({ call_sid: callId, parent_id: "parent_kamla", answer: "later" });
    await sendWeeklyNote("parent_kamla", new Date("2026-10-18T12:40:00.000Z"));
    await relayMessage({
      call_sid: callId,
      parent_id: "parent_kamla",
      message: "Please buy sugar tablets.",
    });
    await escalateUndeliveredAlerts(new Date("2026-10-17T04:00:00.000Z"));

    assert.ok(mockLoggedWhatsapp.length > 0);
    for (const entry of mockLoggedWhatsapp) {
      if (entry.name === "family_relay") continue;
      assertAgainstPack(entry);
    }
  });
});
