import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "../db/client";
import { seed } from "../db/seed";
import { deskSnapshotByToken } from "../db/queries";
import { EXAMPLE_TOKEN } from "../config";
import { istDayKey, nowIstStamp } from "../time";
import { todayStatus } from "../today";
import {
  ensureExampleTodayDesk,
  finishSimulatedDeskCall,
  isLiveBolnaExecutionId,
  placeExampleDeskCall,
  wipeExampleTodayMock,
} from "./example-desk";
import { placeTestCall } from "./place";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.CALL_PROVIDER = "simulated";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

async function wipeToday(parentId = "parent_kamla") {
  const day = istDayKey();
  const rows = await query<{ id: string }>(
    `select id from calls where parent_id = $1 and started_at like $2`,
    [parentId, `${day}%`],
  );
  for (const row of rows) {
    const alerts = await query<{ id: string }>(`select id from alerts where call_id = $1`, [row.id]);
    for (const alert of alerts) await query(`delete from alert_events where alert_id = $1`, [alert.id]);
    await query(`delete from alerts where call_id = $1`, [row.id]);
    await query(`delete from dose_logs where call_id = $1`, [row.id]);
    await query(`delete from call_attempts where call_id = $1`, [row.id]);
    await query(`delete from memory_notes where call_id = $1`, [row.id]);
    await query(`delete from calls where id = $1`, [row.id]);
  }
  await query(`delete from dose_logs where parent_id = $1 and schedule_date = $2`, [parentId, istDayKey()]);
}

describe("example desk call now", () => {
  it("treats mock and seed ids as not live", () => {
    assert.equal(isLiveBolnaExecutionId("mock_parent_kamla_2026-10-21_1"), false);
    assert.equal(isLiveBolnaExecutionId("call_2026-10-21"), false);
    assert.equal(isLiveBolnaExecutionId("8f3c2a1b-9d44-4c11-b2aa-111111111111"), true);
  });

  it("finishes a mute today as a completed call with words, not look", async () => {
    await wipeToday();
    const day = istDayKey();
    await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
      "mock_stuck_today",
      "parent_kamla",
      nowIstStamp(),
      null,
      null,
      "in_progress",
      null,
      null,
      null,
      null,
      null,
      null,
      "mock_stuck_today",
      true,
    ]);
    await query(`insert into dose_logs values ($1,$2,$3,$4,$5,$6,$7,$8)`, [
      "dl_stuck_amlo",
      "parent_kamla",
      "mock_stuck_today",
      "med_amlo",
      day,
      "not_taken",
      "bhool gayi",
      true,
    ]);

    await ensureExampleTodayDesk("parent_kamla");
    const desk = await deskSnapshotByToken(EXAMPLE_TOKEN);
    assert.equal(desk?.parent.id, "parent_kamla");
    assert.equal(desk?.call?.status, "completed");
    assert.match(desk?.call?.transcript_json || "", /Neend theek thi|le li/i);
    assert.equal(
      todayStatus({
        paused: false,
        call: desk!.call,
        doses: desk!.doses,
        actAlerts: desk!.actAlerts.filter((row) => row.call_id === desk!.call?.id),
        nowMin: 12 * 60,
        callTimeMin: 8 * 60 + 30,
      }),
      "good",
    );
    assert.ok(!desk!.doses.some((d) => d.status === "not_taken"));
  });

  it("keeps a live Bolna row when wiping mock today", async () => {
    await wipeToday();
    const liveId = "9aa11111-2222-4333-8444-555555555555";
    await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
      liveId,
      "parent_kamla",
      nowIstStamp(),
      nowIstStamp(),
      90,
      "completed",
      "Live words.",
      "लाइव",
      "Theek hun.",
      "hi",
      JSON.stringify([{ speaker: "parent", hi: "Theek hun.", en: "Theek hun." }]),
      null,
      liveId,
      true,
    ]);
    await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
      "mock_extra_today",
      "parent_kamla",
      nowIstStamp(),
      null,
      null,
      "in_progress",
      null,
      null,
      null,
      null,
      null,
      null,
      "mock_extra_today",
      true,
    ]);
    await wipeExampleTodayMock("parent_kamla");
    const left = await query<{ id: string }>(`select id from calls where id = $1 or id = $2`, [
      liveId,
      "mock_extra_today",
    ]);
    assert.equal(left.length, 1);
    assert.equal(left[0]?.id, liveId);
  });

  it("settings test on simulated EXAMPLE completes with a transcript", async () => {
    await wipeToday();
    const placed = await placeTestCall("parent_kamla");
    assert.equal(placed.ok, true);
    const desk = await deskSnapshotByToken(EXAMPLE_TOKEN);
    assert.equal(desk?.call?.status, "completed");
    assert.ok(desk?.call?.transcript_json);
    assert.match(desk?.call?.mood_quote || desk?.call?.summary_en || "", /Neend|slept|gol/i);
  });

  it("Call now lands a second finished row only after replacing mute mock", async () => {
    await wipeToday();
    await finishSimulatedDeskCall("parent_kamla", "mock_first_done");
    const again = await placeExampleDeskCall("parent_kamla");
    assert.equal(again.ok, true);
    const desk = await deskSnapshotByToken(EXAMPLE_TOKEN);
    assert.equal(desk?.call?.status, "completed");
    assert.ok(desk?.call?.transcript_json);
  });
});
