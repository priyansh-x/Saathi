import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { extractSystemPrompt } from "@/lib/bolna/agent-config";
import { buildCallContext } from "@/lib/bolna/call-context";
import { requestRefill } from "@/lib/bolna/tools";
import { processBolnaWebhook } from "@/lib/bolna/webhook";
import { closeDb, query } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";
import { latchOpsKillSwitch } from "@/lib/ops/flags";
import { ERRAND_FOLLOWUP_EN, ERRAND_FOLLOWUP_HI, pharmacyPageText } from "@/lib/partners/copy";
import { createRefillHandoff, errandById, markErrandFollowupAsked, placeMockOrder, syncMockErrand } from "@/lib/partners/errands";
import { FAKE_ORDER_PATTERN, MOCK_ERRAND_STEP_MS, fakeOrderId } from "@/lib/partners/mock";
import { WALK_COPY } from "@/lib/demo-walk";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.MOCK_EMAIL = "1";
process.env.CALL_PROVIDER = "simulated";
process.env.PARTNER_MODE = "mock";
process.env.SAATHI_KILL_SWITCH = "0";

const BANNED = ["1mg", "PharmEasy", "Netmeds", "Apollo", "Truemeds"];
const DASH = /[\u2013\u2014]/;

before(async () => {
  latchOpsKillSwitch(false);
  process.env.SAATHI_KILL_SWITCH = "0";
  process.env.PARTNER_MODE = "mock";
  await seed();
});

after(async () => {
  await closeDb();
});

describe("demo pharmacy order id", () => {
  it("uses SP-DEMO- plus 6 characters", () => {
    const id = fakeOrderId(Buffer.from([0xab, 0xcd, 0xef]));
    assert.equal(id, "SP-DEMO-ABCDEF");
    assert.match(id, FAKE_ORDER_PATTERN);
    assert.match(fakeOrderId(), FAKE_ORDER_PATTERN);
  });
});

describe("mock status sequence", () => {
  it("ends in delivered in mock mode only", async () => {
    const created = await createRefillHandoff({
      parentId: "parent_kamla",
      callId: "call_seq_mock",
      medicineName: "Amlodipine",
      isExample: true,
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    const placed = await placeMockOrder(created.errand.id);
    assert.equal(placed.ok, true);
    if (!placed.ok) return;
    assert.equal(placed.errand.status, "ordered");
    assert.match(placed.errand.partner_order_id || "", FAKE_ORDER_PATTERN);
    const t0 = Date.parse(placed.errand.ordered_at || "");
    assert.equal((await syncMockErrand(placed.errand, t0)).status, "ordered");
    assert.equal((await syncMockErrand(placed.errand, t0 + MOCK_ERRAND_STEP_MS)).status, "out_for_delivery");
    assert.equal((await syncMockErrand(placed.errand, t0 + MOCK_ERRAND_STEP_MS * 2)).status, "delivered");

    process.env.PARTNER_MODE = "off";
    const other = await createRefillHandoff({
      parentId: "parent_kamla",
      callId: "call_seq_off",
      medicineName: "Metformin",
      isExample: true,
    });
    assert.equal(other.ok, true);
    if (!other.ok) return;
    const offPlaced = await placeMockOrder(other.errand.id);
    assert.equal(offPlaced.ok, true);
    if (!offPlaced.ok) return;
    const tOff = Date.parse(offPlaced.errand.ordered_at || "");
    const later = await syncMockErrand(offPlaced.errand, tOff + MOCK_ERRAND_STEP_MS * 2);
    assert.equal(later.status, "ordered");
    process.env.PARTNER_MODE = "mock";
  });
});

describe("kill switch", () => {
  it("blocks Place order and a new partner handoff", async () => {
    const open = await createRefillHandoff({
      parentId: "parent_kamla",
      callId: "call_kill_open",
      medicineName: "Amlodipine",
      isExample: true,
    });
    assert.equal(open.ok, true);
    if (!open.ok) return;
    process.env.SAATHI_KILL_SWITCH = "1";
    const blockedPlace = await placeMockOrder(open.errand.id);
    assert.equal(blockedPlace.ok, false);
    if (!blockedPlace.ok) assert.equal(blockedPlace.reason, "kill_switch");
    const blockedHandoff = await createRefillHandoff({
      parentId: "parent_kamla",
      callId: "call_kill_new",
      medicineName: "Amlodipine",
      isExample: true,
    });
    assert.equal(blockedHandoff.ok, false);
    const refill = await requestRefill({
      call_sid: "call_kill_refill",
      parent_id: "parent_kamla",
      medicine_name: "Amlodipine",
    });
    assert.equal(refill.ok, true);
    if (refill.ok) {
      assert.equal(refill.handoff_blocked, true);
      assert.equal(refill.errand_id, null);
    }
    process.env.SAATHI_KILL_SWITCH = "0";
    latchOpsKillSwitch(false);
  });
});

describe("errand_followup", () => {
  it("appears once for a delivered errand and clears after the call", async () => {
    await query(`delete from errands where parent_id = 'parent_kamla'`);
    const created = await createRefillHandoff({
      parentId: "parent_kamla",
      callId: "call_follow_src",
      medicineName: "Amlodipine",
      isExample: true,
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    const placed = await placeMockOrder(created.errand.id);
    assert.equal(placed.ok, true);
    if (!placed.ok) return;
    await query(
      `update errands set status = 'delivered', delivered_at = ordered_at, told_parent_call_id = null where id = $1`,
      [created.errand.id],
    );
    const before = await buildCallContext("parent_kamla");
    assert.equal(before.errand_followup.includes(ERRAND_FOLLOWUP_HI), true);
    assert.equal(before.errand_followup.includes(ERRAND_FOLLOWUP_EN), true);

    const sid = `call_follow_ask_${Date.now()}`;
    const result = await processBolnaWebhook(
      {
        status: "completed",
        conversation_duration: 80,
        transcript: "assistant: Namaste\nuser: Haan.",
        context_details: { recipient_data: { parent_id: "parent_kamla" } },
        telephony_data: { to_number: "+910000000000", hangup_reason: "completed" },
      },
      sid,
    );
    assert.equal("call_id" in result && result.call_id, sid);
    const row = await errandById(created.errand.id);
    assert.equal(row?.told_parent_call_id, sid);
    const after = await buildCallContext("parent_kamla");
    assert.equal(after.errand_followup, "");
    await markErrandFollowupAsked("parent_kamla", "call_extra", "completed");
    const still = await errandById(created.errand.id);
    assert.equal(still?.told_parent_call_id, sid);
  });

  it("puts the ask after the memory callback in the agent prompt", () => {
    const md = readFileSync(path.join(process.cwd(), "docs/saathi/voice/system_prompt_bolna.md"), "utf8");
    const prompt = extractSystemPrompt(md);
    const memory = prompt.indexOf("Memory callback");
    const follow = prompt.indexOf(ERRAND_FOLLOWUP_HI);
    const family = prompt.indexOf("Family message");
    assert.ok(memory >= 0 && follow > memory && family > follow);
    assert.match(prompt, /Has your medicine arrived\?/);
    assert.match(prompt, /\{\{errand_followup\}\}/);
  });
});

describe("demo pharmacy copy", () => {
  it("never names a real pharmacy and has no em dash", () => {
    const page = readFileSync(path.join(process.cwd(), "src/app/partner/mock/[id]/page.tsx"), "utf8");
    const card = readFileSync(path.join(process.cwd(), "src/components/family/errand-card.tsx"), "utf8");
    const copy = pharmacyPageText();
    const hay = `${copy}\n${page}\n${card}\n${WALK_COPY.en.nextMorningBody}\n${WALK_COPY.hi.nextMorningBody}`;
    for (const name of BANNED) {
      assert.equal(hay.toLowerCase().includes(name.toLowerCase()), false, name);
    }
    assert.equal(DASH.test(copy), false);
    assert.equal(DASH.test(WALK_COPY.en.nextMorningBody), false);
    assert.equal(DASH.test(WALK_COPY.hi.nextMorningBody), false);
    assert.match(copy, /Saathi Pharmacy \(demo\)/);
    assert.match(copy, /Saathi फ़ार्मेसी \(डेमो\)/);
    assert.match(copy, /Demo partner, no real order placed/);
  });
});
