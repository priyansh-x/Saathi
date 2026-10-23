import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { closeDb, query } from "../db/client";
import { seed } from "../db/seed";
import {
  isPreparedCall,
  logTestRing,
  prepareMorningCall,
  rememberBlockedDial,
  testRingLimit,
} from "./prepare";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";
process.env.CALL_PROVIDER = "simulated";

const T0 = new Date("2026-10-23T03:30:00.000Z");

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("ring now limits", () => {
  it("blocks a 4th test ring the same IST day", async () => {
    await query(`delete from outbound_messages where parent_id = 'parent_kamla' and template = 'ring_now'`);
    await logTestRing("parent_kamla", "+910000000000", T0);
    await logTestRing("parent_kamla", "+910000000000", new Date(T0.getTime() + 11 * 60_000));
    await logTestRing("parent_kamla", "+910000000000", new Date(T0.getTime() + 22 * 60_000));
    const fourth = await prepareMorningCall("parent_kamla", new Date(T0.getTime() + 33 * 60_000), { forceTest: true });
    assert.equal("ok" in fourth && fourth.ok, false);
    if ("ok" in fourth && !fourth.ok) {
      assert.equal(fourth.reason, "ring_rate_limit");
      assert.ok((fourth.retryInMin ?? 0) >= 1);
    }
    const blocked = await query<{ n: number }>(
      `select count(*)::int as n from outbound_messages where parent_id = 'parent_kamla' and status = 'blocked_ring_rate_limit'`,
    );
    assert.ok((blocked[0]?.n ?? 0) >= 1);
  });

  it("blocks a test ring inside the 10-minute cooldown", async () => {
    await query(`delete from outbound_messages where parent_id = 'parent_kamla' and template in ('ring_now','place_call')`);
    await logTestRing("parent_kamla", "+910000000000", T0);
    const soon = await testRingLimit("parent_kamla", "+910000000000", new Date(T0.getTime() + 2 * 60_000));
    assert.equal(soon.ok, false);
    if (!soon.ok) {
      assert.equal(soon.reason, "ring_rate_limit");
      assert.equal(soon.retryInMin, 8);
    }
  });

  it("applies the daily minute budget to test rings", async () => {
    await query(`insert into parents values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [
      "parent_budget",
      "Budget Parent",
      "Budget",
      "Delhi",
      "Asia/Kolkata",
      "+910000000000",
      "hi",
      "08:00",
      false,
      false,
      true,
    ]);
    await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
      "call_budget_test",
      "parent_budget",
      "2026-10-23T08:30:00+05:30",
      "2026-10-23T08:46:00+05:30",
      16 * 60,
      "completed",
      null,
      null,
      null,
      null,
      null,
      null,
      "call_budget_test",
      true,
    ]);
    try {
      const blocked = await prepareMorningCall("parent_budget", T0, { forceTest: true });
      assert.equal("ok" in blocked && blocked.ok, false);
      if ("ok" in blocked && !blocked.ok) assert.equal(blocked.reason, "budget");
    } finally {
      await query(`delete from outbound_messages where parent_id = 'parent_budget'`);
      await query(`delete from calls where parent_id = 'parent_budget'`);
      await query(`delete from parents where id = 'parent_budget'`);
    }
  });

  it("does not send bypass_call_guardrails by default", async () => {
    await query(`delete from outbound_messages where parent_id = 'parent_kamla' and template = 'ring_now'`);
    const prev = process.env.ALLOW_BOLNA_GUARDRAIL_BYPASS;
    delete process.env.ALLOW_BOLNA_GUARDRAIL_BYPASS;
    try {
      const prepared = await prepareMorningCall("parent_kamla", new Date("2026-10-24T03:30:00.000Z"), {
        forceTest: true,
      });
      assert.equal(isPreparedCall(prepared), true);
      if (isPreparedCall(prepared)) {
        assert.equal(prepared.payload.bypass_call_guardrails, undefined);
      }
    } finally {
      if (prev !== undefined) process.env.ALLOW_BOLNA_GUARDRAIL_BYPASS = prev;
    }
  });

  it("refuses a non-example parent when the allowlist env is empty", async () => {
    const prev = process.env.ALLOWED_PHONE_NUMBERS;
    process.env.ALLOWED_PHONE_NUMBERS = "";
    await query(`insert into parents values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [
      "parent_not_listed",
      "Pilot Parent",
      "Pilot",
      "Delhi",
      "Asia/Kolkata",
      "+919888888888",
      "hi",
      "08:00",
      false,
      false,
      false,
    ]);
    try {
      const result = await prepareMorningCall("parent_not_listed", T0, { forceTest: true });
      assert.equal("ok" in result && result.ok, false);
      if ("ok" in result && !result.ok) assert.equal(result.reason, "not_allowlisted");
    } finally {
      await query(`delete from outbound_messages where parent_id = 'parent_not_listed'`);
      await query(`delete from parents where id = 'parent_not_listed'`);
      if (prev === undefined) delete process.env.ALLOWED_PHONE_NUMBERS;
      else process.env.ALLOWED_PHONE_NUMBERS = prev;
    }
  });

  it("records blocked test rings with rememberBlockedDial", async () => {
    await rememberBlockedDial("parent_kamla", "+910000000000", "ring_rate_limit", T0);
    const rows = await query<{ status: string }>(
      `select status from outbound_messages where parent_id = 'parent_kamla' and status = 'blocked_ring_rate_limit' limit 1`,
    );
    assert.equal(rows[0]?.status, "blocked_ring_rate_limit");
  });
});

describe("live demo fallback", () => {
  it("does not call a placer from the fallback module", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, "../../components/demo/live-fallback.tsx"), "utf8");
    assert.equal(src.includes("placeTestCall"), false);
    assert.equal(src.includes("placeMorningCall"), false);
    assert.equal(src.includes("placeCall"), false);
  });
});
