import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bodyVariables, whatsappTemplatePack } from "./template-pack";
import { buildWhatsappPayload } from "./send";
import type { TemplateName } from "./templates";

/** Every Meta template the app can send (locale is separate). */
const APP_SENDS: Exclude<TemplateName, "hello_world">[] = [
  "daily_briefing_good",
  "daily_briefing_missed_med",
  "daily_briefing_low_mood",
  "missed_call_soft",
  "safety_alert_unreachable",
  "safety_alert_emergency",
  "safety_alert_urgent",
  "alert_ack_update",
  "responder_optin",
  "responder_alert_emergency",
  "responder_alert_unreachable",
  "weekly_summary",
  "consent_declined",
  "consent_later",
];

describe("runtime WhatsApp sends match the pack", () => {
  it("every app send uses pack name, language, variable count/order, and button parameters", () => {
    const pack = whatsappTemplatePack();
    const packNames = new Set(pack.map((tpl) => tpl.name));
    for (const name of APP_SENDS) {
      assert.equal(packNames.has(name), true, name);
      for (const language of ["en", "hi"] as const) {
        const tpl = pack.find((row) => row.name === name && row.language === language);
        assert.ok(tpl, `${name}/${language}`);
        const vars = tpl.examples;
        assert.equal(vars.length, bodyVariables(tpl.body).length, `${name}/${language} vars`);
        const payload = buildWhatsappPayload({
          to: "+910000000000",
          template: name,
          language,
          vars,
          buttonUrlVar: "example-kamla",
        });
        assert.equal(payload.type, "template");
        assert.equal(payload.template?.name, name);
        assert.equal(payload.template?.language.code, language);
        const components = payload.template?.components as { type: string; sub_type?: string; parameters?: unknown[] }[];
        const body = components.find((c) => c.type === "body");
        assert.equal(body?.parameters?.length, vars.length);
        const buttons = components.filter((c) => c.type === "button");
        assert.equal(buttons.length, tpl.buttons.length, `${name}/${language} buttons`);
        tpl.buttons.forEach((btn, i) => {
          if (btn.type === "QUICK_REPLY") {
            assert.equal(buttons[i]?.sub_type, "quick_reply");
            assert.deepEqual(buttons[i]?.parameters, [{ type: "payload", payload: btn.text }]);
          } else {
            assert.equal(buttons[i]?.sub_type, "url");
            assert.deepEqual(buttons[i]?.parameters, [{ type: "text", text: "example-kamla" }]);
          }
        });
      }
    }
  });
});
