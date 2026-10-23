import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";
import { demoMorningLines } from "@/lib/demo-lines";
import { demoModeAllowed, resetDemoHousehold } from "@/lib/demo-mode";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.CALL_PROVIDER = "simulated";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("demo mode", () => {
  it("is on when both mocks are on and the transcript is bilingual EXAMPLE copy", () => {
    assert.equal(demoModeAllowed(), true);
    const lines = demoMorningLines();
    assert.ok(lines.length >= 4);
    assert.ok(lines.every((l) => l.hi && l.en));
    assert.match(lines[0]?.hi || "", /नमस्ते|कमला/);
  });

  it("turns off the walk when either mock is off", () => {
    const prevB = process.env.MOCK_BOLNA;
    const prevW = process.env.MOCK_WHATSAPP;
    try {
      process.env.MOCK_WHATSAPP = "0";
      process.env.MOCK_BOLNA = "1";
      assert.equal(demoModeAllowed(), false);
    } finally {
      process.env.MOCK_BOLNA = prevB;
      process.env.MOCK_WHATSAPP = prevW;
    }
  });

  it("reset wipes only EXAMPLE rows", async () => {
    await query(`insert into parents (id, full_name, first_name, city, timezone, phone, languages, call_time, paused, recording_consent, is_example)
      values ('parent_live','Live','Live','Delhi','Asia/Kolkata','000','en','08:00',false,false,false)`);
    await resetDemoHousehold();
    const live = await query<{ id: string }>(`select id from parents where id = 'parent_live'`);
    const kamla = await query<{ id: string }>(`select id from parents where id = 'parent_kamla'`);
    assert.equal(live[0]?.id, "parent_live");
    assert.equal(kamla[0]?.id, "parent_kamla");
    await query(`delete from parents where id = 'parent_live'`);
  });
});
