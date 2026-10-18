import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";
import { killSwitchOn } from "@/lib/config";
import { gateOutbound } from "@/lib/outbound";
import { canViewOps, opsHttpStatus } from "@/lib/ops/access";
import { latchOpsKillSwitch } from "@/lib/ops/flags";
import { setOpsKillSwitch } from "@/lib/ops/kill-switch";
import { maskPhone } from "@/lib/ops/mask";
import { loadOpsSnapshot } from "@/lib/ops/snapshot";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";

before(async () => {
  await seed();
});

after(async () => {
  latchOpsKillSwitch(false);
  process.env.SAATHI_KILL_SWITCH = "0";
  await closeDb();
});

describe("ops access", () => {
  it("404s unless the signed-in email is on OPS_EMAILS", () => {
    const prev = process.env.OPS_EMAILS;
    process.env.OPS_EMAILS = "priyansh@example.com";
    try {
      assert.equal(canViewOps(undefined), false);
      assert.equal(opsHttpStatus(null), 404);
      assert.equal(opsHttpStatus("visitor@example.com"), 404);
      assert.equal(opsHttpStatus("priyansh@example.com"), 200);
      process.env.OPS_EMAILS = "";
      assert.equal(opsHttpStatus("priyansh@example.com"), 404);
    } finally {
      process.env.OPS_EMAILS = prev;
    }
  });
});

describe("ops masking", () => {
  it("keeps only the last four digits of a number", () => {
    assert.equal(maskPhone("+910000000008"), "••••0008");
    assert.equal(maskPhone("+910000000000"), "••••0000");
    assert.doesNotMatch(maskPhone("+910000000008"), /98765/);
  });
});

describe("ops snapshot", () => {
  it("never includes transcripts, quotes, or unmasked phones", async () => {
    const snap = await loadOpsSnapshot();
    const blob = JSON.stringify(snap);
    assert.doesNotMatch(blob, /transcript/i);
    assert.doesNotMatch(blob, /"quote"/i);
    assert.doesNotMatch(blob, /\+91[0-9]{10}/);
    for (const row of snap.outbound) {
      assert.match(row.to, /••••\d{4}|••••@/);
      assert.equal(Object.keys(row).sort().join(","), "at,delivery,gate,kind,to");
      assert.match(row.delivery, /^(sent|delivered|read|failed|mock|example|undelivered|—)$/);
    }
    for (const row of snap.openAlerts) {
      assert.equal("quote" in row, false);
      assert.ok(row.category);
    }
    assert.equal(typeof snap.familyCount, "number");
    assert.equal(snap.flags.callProvider, "simulated");
    assert.equal(snap.flags.mockBolna, true);
    assert.equal(snap.flags.mockWhatsapp, true);
    assert.equal(snap.flags.mockEmail, true);
    assert.ok(snap.bolna.checks.some((c) => c.id === "call_provider" && c.detail === "simulated"));
    for (const check of snap.bolna.checks) {
      assert.doesNotMatch(check.detail, /Bearer /);
    }
    assert.equal(snap.waitlistCount === null || typeof snap.waitlistCount === "number", true);
    assert.ok(snap.whatsapp.checks.some((c) => c.id === "token"));
    for (const check of snap.whatsapp.checks) {
      assert.doesNotMatch(check.detail, /Bearer /);
    }
  });

  it("kill switch toggle writes an audit row and blocks outbound", async () => {
    process.env.SAATHI_KILL_SWITCH = "0";
    latchOpsKillSwitch(false);
    try {
      await setOpsKillSwitch(true, "priyansh@example.com");
      assert.equal(killSwitchOn(), true);
      const blocked = gateOutbound("whatsapp", "+910000000000");
      assert.equal(blocked.ok, false);
      if (!blocked.ok) assert.equal(blocked.reason, "kill_switch");
      const snap = await loadOpsSnapshot();
      assert.equal(snap.killSwitch.on, true);
      assert.match(JSON.stringify(snap.audits), /kill_switch/);
      await setOpsKillSwitch(false, "priyansh@example.com");
      assert.equal(killSwitchOn(), false);
    } finally {
      latchOpsKillSwitch(false);
      process.env.SAATHI_KILL_SWITCH = "0";
    }
  });
});
