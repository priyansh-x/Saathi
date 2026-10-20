import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CallRow, DoseLog } from "@/lib/db/types";
import {
  callBullets,
  callTranscriptLines,
  callGlyph,
  cellAria,
  historySummary,
  medsOnDay,
  mondayIndex,
  moodFromCall,
  qs,
} from "@/lib/history";

function call(partial: Partial<CallRow>): CallRow {
  return {
    id: "c1",
    parent_id: "p",
    started_at: "2026-10-13T08:32:00+05:30",
    ended_at: "2026-10-13T08:36:00+05:30",
    duration_sec: 240,
    status: "completed",
    summary_en: "Kamla slept well.",
    summary_hi: "नींद ठीक थी।",
    mood_quote: "Neend theek thi.",
    mood_quote_lang: "hi",
    transcript_json: null,
    mood: "cheerful",
    ...partial,
  };
}

describe("history helpers", () => {
  it("counts every medicine, not just one id", () => {
    const doses: DoseLog[] = [
      { id: "1", medicine_id: "med_amlo", schedule_date: "2026-10-13", status: "taken", said: null },
      { id: "2", medicine_id: "med_met", schedule_date: "2026-10-13", status: "not_taken", said: null },
    ];
    assert.deepEqual(medsOnDay(doses, "2026-10-13", ["med_amlo", "med_met"]), { taken: 1, total: 2 });
  });

  it("reads mood from the stored field, not the quote", () => {
    assert.equal(
      moodFromCall(call({ mood: "cheerful", mood_quote: "Seene mein dard ho raha hai." })),
      "cheerful",
    );
    assert.equal(moodFromCall(call({ status: "missed", mood: "low" })), "unclear");
    assert.equal(moodFromCall(call({ mood: null })), "unclear");
  });

  it("builds calendar labels and glyphs without enum words", () => {
    const label = cellAria("2026-10-13", call({}), { taken: 2, total: 2 }, "en");
    assert.match(label, /Tue 13 Oct: call answered, 2 of 2 medicines/);
    assert.equal(callGlyph(call({})), "✓");
    assert.equal(callGlyph(call({ status: "missed" })), "✕");
    assert.equal(callGlyph(null), "–");
  });

  it("keeps lang and days together", () => {
    assert.equal(qs({ lang: "hi", days: "7" }), "?lang=hi&days=7");
    assert.equal(qs({ lang: "en", days: undefined }), "?lang=en");
  });

  it("summarises a week", () => {
    const days = ["2026-10-13", "2026-10-14"];
    const calls = [call({ started_at: "2026-10-13T08:32:00+05:30" }), call({ id: "c2", started_at: "2026-10-14T08:32:00+05:30", status: "missed" })];
    const doses: DoseLog[] = [
      { id: "1", medicine_id: "a", schedule_date: "2026-10-13", status: "taken", said: null },
      { id: "2", medicine_id: "b", schedule_date: "2026-10-13", status: "taken", said: null },
      { id: "3", medicine_id: "a", schedule_date: "2026-10-14", status: "not_asked", said: null },
      { id: "4", medicine_id: "b", schedule_date: "2026-10-14", status: "not_asked", said: null },
    ];
    assert.equal(historySummary(days, calls, doses, ["a", "b"], "en"), "Answered 1 of 2 calls · 2 of 4 medicines");
  });

  it("aligns a Tuesday to Monday-start padding of 1", () => {
    assert.equal(mondayIndex("2026-10-13"), 1);
  });

  it("splits a summary into short bullets", () => {
    assert.deepEqual(callBullets("Kamla slept well. She took Amlodipine."), [
      "Kamla slept well.",
      "She took Amlodipine.",
    ]);
  });

  it("reads a conversation whether it is a string or already parsed", () => {
    const lines = [{ speaker: "parent", hi: "theek hoon", en: "theek hoon" }];
    assert.deepEqual(callTranscriptLines(JSON.stringify(lines)), lines);
    assert.deepEqual(callTranscriptLines(lines), lines);
    assert.deepEqual(callTranscriptLines("{"), []);
  });
});
