import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb } from "../db/client";
import { seed } from "../db/seed";
import { canSendTestWhatsapp, parseTestSendArgs, plannedTestSend, resolveTestSendParentId } from "./test-send-cli";

before(async () => {
  await seed();
});
after(async () => {
  await closeDb();
});

process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";

describe("whatsapp:test-send CLI", () => {
  it("parses phone and briefing and prints a Graph template payload", () => {
    const parsed = parseTestSendArgs(["+910000000001", "briefing"]);
    assert.equal(parsed.yes, false);
    assert.equal(parsed.phone.replace(/\D/g, "").slice(-10), "0000000001");
    assert.equal(parsed.templateArg, "briefing");
    const plan = plannedTestSend(parsed.phone, parsed.templateArg);
    assert.equal(plan.example, true);
    assert.equal(plan.payload?.type, "template");
    assert.equal(plan.payload?.template?.name, "daily_briefing_good");
    assert.equal(plan.url.includes("{phone-number-id}"), true);
    assert.match(JSON.stringify(plan), /Maa|example-kamla/);
  });

  it("only allows a live send with --yes, MOCK_WHATSAPP=0, allowlist, and an approved template", async () => {
    const phone = "+910000000001";
    assert.equal(canSendTestWhatsapp(phone, "briefing", false).reason, "missing_yes");
    const prev = {
      mock: process.env.MOCK_WHATSAPP,
      phones: process.env.ALLOWED_PHONE_NUMBERS,
      approved: process.env.WHATSAPP_TEMPLATES_APPROVED,
      list: process.env.WHATSAPP_APPROVED_TEMPLATES,
    };
    process.env.MOCK_WHATSAPP = "0";
    process.env.ALLOWED_PHONE_NUMBERS = "";
    process.env.WHATSAPP_TEMPLATES_APPROVED = "0";
    process.env.WHATSAPP_APPROVED_TEMPLATES = "";
    try {
      assert.equal(canSendTestWhatsapp(phone, "briefing", true).reason, "unapproved_template");
      process.env.WHATSAPP_APPROVED_TEMPLATES = "daily_briefing_good";
      assert.equal(canSendTestWhatsapp(phone, "briefing", true).reason, "not_allowlisted");
      process.env.ALLOWED_PHONE_NUMBERS = "+910000000001";
      const ok = canSendTestWhatsapp(phone, "briefing", true);
      assert.equal(ok.ok, true);
      if (ok.ok) assert.equal(ok.template, "daily_briefing_good");
      const stranger = "+919998887776";
      process.env.ALLOWED_PHONE_NUMBERS = stranger;
      const plan = plannedTestSend(stranger, "briefing");
      assert.equal(plan.allowlisted, true);
      const liveStranger = canSendTestWhatsapp(stranger, "briefing", true);
      assert.equal(liveStranger.ok, true);
      const parentId = await resolveTestSendParentId(stranger);
      assert.equal(parentId, "parent_kamla");
    } finally {
      process.env.MOCK_WHATSAPP = prev.mock;
      process.env.ALLOWED_PHONE_NUMBERS = prev.phones;
      process.env.WHATSAPP_TEMPLATES_APPROVED = prev.approved;
      if (prev.list) process.env.WHATSAPP_APPROVED_TEMPLATES = prev.list;
      else delete process.env.WHATSAPP_APPROVED_TEMPLATES;
    }
  });
});
