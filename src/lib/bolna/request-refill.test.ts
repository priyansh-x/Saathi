import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { extractSystemPrompt } from "./agent-config";
import { requestRefill } from "./tools";
import { closeDb, query } from "../db/client";
import { seed } from "../db/seed";
import { categoryWords } from "../today";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("scam prompt and copy", () => {
  it("tells the agent to raise SCAM_CONCERN without legal advice", () => {
    const md = readFileSync(path.join(process.cwd(), "docs/saathi/voice/system_prompt_bolna.md"), "utf8");
    const prompt = extractSystemPrompt(md);
    assert.match(prompt, /SCAM_CONCERN/);
    assert.match(prompt, /needs a look, not Act now/);
    assert.match(prompt, /No legal advice/);
    assert.match(prompt, /never ask for OTPs or money/);
  });

  it("labels scam and refill in en/hi with an icon", () => {
    assert.match(categoryWords("SCAM_CONCERN", "en"), /scam concern/);
    assert.match(categoryWords("SCAM_CONCERN", "hi"), /धोखाधड़ी/);
    assert.match(categoryWords("REFILL:Amlodipine", "en"), /running low/);
  });
});

describe("request_refill", () => {
  it("creates a look item with the running-low copy and is idempotent per call and medicine", async () => {
    const first = await requestRefill({
      call_sid: "call_refill_1",
      parent_id: "parent_kamla",
      medicine_name: "Amlodipine",
    });
    assert.equal(first.ok, true);
    if (!first.ok) return;
    assert.match(first.quote, /Amlodipine is running low/);
    const second = await requestRefill({
      call_sid: "call_refill_1",
      parent_id: "parent_kamla",
      medicine_name: "Amlodipine",
    });
    assert.equal(second.ok, true);
    if (second.ok) assert.equal(second.replay, true);
    const alerts = await query<{ n: number }>(
      `select count(*)::int as n from alerts where call_id = 'call_refill_1' and category = 'REFILL:Amlodipine'`,
    );
    assert.equal(alerts[0]?.n, 1);
    const look = await query<{ level: string }>(`select level from alerts where id = $1`, [first.alert_id]);
    assert.equal(look[0]?.level, "look");
  });
});
