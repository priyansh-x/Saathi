import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { placeMorningCall } from "../bolna/place";
import { recordSpokenConsent } from "../consent";
import { closeDb, query } from "../db/client";
import { seed } from "../db/seed";

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

describe("stop on any call", () => {
  it("tells the agent to record_consent no for stop or बंद करो on any call", () => {
    const agent = JSON.parse(readFileSync(path.join(process.cwd(), "scripts/bolna/agent.json"), "utf8")) as {
      prompt: string;
    };
    assert.match(agent.prompt, /On any call/);
    assert.match(agent.prompt, /stop/);
    assert.match(agent.prompt, /बंद करो/);
    assert.match(agent.prompt, /record_consent/);
    assert.match(agent.prompt, /answer=no/);
  });

  it("honours no after she had already said yes", async () => {
    await seed();
    await query(
      `update parents set consent_status = 'given', paused = false, consent_later_count = 0 where id = 'parent_kamla'`,
    );
    const stop = await recordSpokenConsent({ call_sid: "c_stop", parent_id: "parent_kamla", answer: "no" });
    assert.equal(stop.status, "declined");
    assert.equal(stop.paused, true);
    const placed = await placeMorningCall("parent_kamla");
    assert.equal(placed.ok, false);
  });
});
