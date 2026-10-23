import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isWhatsappTemplateApproved } from "@/lib/config";
import { whatsappTemplatePack } from "@/lib/whatsapp/template-pack";

describe("DRAFT briefing and safety templates", () => {
  it("marks briefing and safety templates DRAFT in the pack", () => {
    const pack = whatsappTemplatePack();
    for (const name of [
      "daily_briefing_good",
      "daily_briefing_missed_med",
      "daily_briefing_low_mood",
      "safety_alert_unreachable",
      "safety_alert_unreachable_solo",
      "safety_alert_emergency",
      "safety_alert_emergency_solo",
      "safety_alert_urgent",
      "safety_alert_urgent_solo",
    ]) {
      const rows = pack.filter((t) => t.name === name);
      assert.equal(rows.length, 2);
      assert.ok(rows.every((t) => t.status === "DRAFT"));
    }
  });

  it("returns false for DRAFT templates even when the approved flag is on", () => {
    const prev = {
      flag: process.env.WHATSAPP_TEMPLATES_APPROVED,
      list: process.env.WHATSAPP_APPROVED_TEMPLATES,
    };
    process.env.WHATSAPP_TEMPLATES_APPROVED = "1";
    process.env.WHATSAPP_APPROVED_TEMPLATES = "";
    try {
      assert.equal(isWhatsappTemplateApproved("safety_alert_emergency_solo"), false);
      assert.equal(isWhatsappTemplateApproved("safety_alert_emergency"), false);
      assert.equal(isWhatsappTemplateApproved("daily_briefing_good", "en"), false);
      assert.equal(isWhatsappTemplateApproved("weekly_summary"), true);
    } finally {
      process.env.WHATSAPP_TEMPLATES_APPROVED = prev.flag;
      process.env.WHATSAPP_APPROVED_TEMPLATES = prev.list;
    }
  });
});
