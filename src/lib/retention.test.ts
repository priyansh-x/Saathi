import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";
import { applyRetention } from "@/lib/retention";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.RETENTION_TRANSCRIPT_DAYS = "30";
process.env.RETENTION_SUMMARY_DAYS = "90";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("data retention", () => {
  it("drops transcripts at 30 days and summaries/quotes at 90, keeping alerts", async () => {
    const now = new Date("2026-10-18T03:00:00.000Z");
    await query(`delete from alert_events where alert_id like 'al_ret%'`);
    await query(`delete from alerts where id like 'al_ret%'`);
    await query(`delete from calls where id like 'call_ret%'`);
    await query(`delete from webhook_events where id like 'wh_ret%'`);

    await query(
      `insert into calls (id, parent_id, started_at, ended_at, duration_sec, status, summary_en, summary_hi, mood_quote, transcript_json, is_example)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)`,
      [
        "call_ret_40",
        "parent_kamla",
        "2026-09-08T08:30:00+05:30",
        "2026-09-08T08:34:00+05:30",
        240,
        "completed",
        "Keep this summary",
        "सार रखें",
        "a quote at 40d",
        JSON.stringify([{ speaker: "parent", hi: "secret 40" }]),
      ],
    );
    await query(
      `insert into calls (id, parent_id, started_at, ended_at, duration_sec, status, summary_en, summary_hi, mood_quote, transcript_json, is_example)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)`,
      [
        "call_ret_100",
        "parent_kamla",
        "2026-07-08T08:30:00+05:30",
        "2026-07-08T08:34:00+05:30",
        240,
        "completed",
        "Drop this summary",
        "सार मिटे",
        "old quote",
        JSON.stringify([{ speaker: "parent", hi: "secret 100" }]),
      ],
    );
    await query(
      `insert into alerts (id, parent_id, call_id, category, level, quote, created_at, late, source, is_example)
       values ($1,$2,$3,$4,$5,$6,$7,false,'mid_call',true)`,
      ["al_ret_100", "parent_kamla", "call_ret_100", "chest_pain", "act", "her old words", "2026-07-08T08:33:00+05:30"],
    );
    await query(`insert into webhook_events (id, source, execution_id, payload, at, processed) values ($1,$2,$3,$4,$5,true)`, [
      "wh_ret_40",
      "bolna",
      "ex_ret",
      JSON.stringify({ transcript: "secret webhook" }),
      "2026-09-08T08:34:00+05:30",
    ]);

    const first = await applyRetention(now);
    assert.ok(first.transcripts >= 1);
    assert.ok(first.summaries >= 1);
    const second = await applyRetention(now);
    assert.equal(second.transcripts, 0);
    assert.equal(second.summaries, 0);
    assert.equal(second.alertQuotes, 0);

    const young = await query<{ transcript_json: string | null; summary_en: string | null; mood_quote: string | null }>(
      `select transcript_json, summary_en, mood_quote from calls where id = 'call_ret_40'`,
    );
    assert.equal(young[0]?.transcript_json, null);
    assert.equal(young[0]?.summary_en, "Keep this summary");
    assert.equal(young[0]?.mood_quote, "a quote at 40d");

    const old = await query<{ transcript_json: string | null; summary_en: string | null; mood_quote: string | null }>(
      `select transcript_json, summary_en, mood_quote from calls where id = 'call_ret_100'`,
    );
    assert.equal(old[0]?.transcript_json, null);
    assert.equal(old[0]?.summary_en, null);
    assert.equal(old[0]?.mood_quote, null);

    const alert = await query<{ quote: string; category: string }>(`select quote, category from alerts where id = 'al_ret_100'`);
    assert.equal(alert[0]?.category, "chest_pain");
    assert.equal(alert[0]?.quote, "");

    const hook = await query<{ payload: string }>(`select payload from webhook_events where id = 'wh_ret_40'`);
    assert.equal(hook[0]?.payload, '{"retained":false}');
  });
});
