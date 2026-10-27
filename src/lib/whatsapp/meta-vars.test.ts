import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildWhatsappPayload } from "@/lib/whatsapp/send";
import {
  dailyBriefingGoodVars,
  dailyBriefingLowMoodVars,
  dailyBriefingMissedMedVars,
  familyTemplateLanguage,
  metaBodyComponents,
  quoteParam,
  safetyAlertEmergencyVars,
  safetyAlertUnreachableVars,
  templateCallTime,
} from "@/lib/whatsapp/meta-vars";

process.env.MOCK_WHATSAPP = "1";
process.env.MOCK_BOLNA = "1";
process.env.CALL_PROVIDER = "simulated";

const DESK = "https://saathi.example/d/example-kamla";

function assertPayload(
  name: string,
  language: "en" | "hi",
  vars: string[],
) {
  const payload = buildWhatsappPayload({
    to: "+919999999999",
    template: name,
    language,
    vars,
  });
  assert.equal(payload.template?.name, name);
  assert.equal(payload.template?.language.code, language);
  assert.deepEqual(payload.template?.components, metaBodyComponents(vars));
  const body = payload.template?.components?.[0] as {
    type: string;
    parameters: { type: string; text: string }[];
  };
  assert.equal(body.type, "body");
  assert.equal(body.parameters.every((p) => p.type === "text" && p.text.length > 0), true);
}

describe("family template language", () => {
  it("uses hi when the family's first language is Hindi, else en", () => {
    assert.equal(familyTemplateLanguage("hi,en"), "hi");
    assert.equal(familyTemplateLanguage("Hindi"), "hi");
    assert.equal(familyTemplateLanguage("en,hi"), "en");
    assert.equal(familyTemplateLanguage(""), "en");
  });
});

describe("Meta Utility components", () => {
  it("daily_briefing_good en and hi", () => {
    const en = dailyBriefingGoodVars(
      {
        childName: "Rohit",
        parentName: "Kamla",
        callTime: "08:05",
        medicines: "took both tablets (BP, sugar)",
        quote: "Ghutne ka dard aaj kam hai.",
      },
      "en",
    );
    assert.deepEqual(en, [
      "Rohit",
      "Kamla",
      "8:05 AM",
      "took both tablets (BP, sugar)",
      "Ghutne ka dard aaj kam hai.",
    ]);
    assertPayload("daily_briefing_good", "en", en);

    const hi = dailyBriefingGoodVars(
      {
        childName: "रोहित",
        parentName: "कमला",
        callTime: "08:05",
        medicines: "दोनों गोलियाँ (BP, शुगर) ले लीं",
        quote: "घुटने का दर्द आज कम है",
      },
      "hi",
    );
    assert.deepEqual(hi, [
      "रोहित",
      "कमला",
      "8:05",
      "दोनों गोलियाँ (BP, शुगर) ले लीं",
      "घुटने का दर्द आज कम है",
    ]);
    assertPayload("daily_briefing_good", "hi", hi);
  });

  it("daily_briefing_missed_med en and hi", () => {
    const en = dailyBriefingMissedMedVars(
      {
        childName: "Rohit",
        parentName: "Kamla",
        callTime: "08:05",
        missedDoses: "Sugar tablet (morning)",
      },
      "en",
    );
    assert.deepEqual(en, ["Rohit", "Kamla", "8:05 AM", "Sugar tablet (morning)"]);
    assertPayload("daily_briefing_missed_med", "en", en);

    const hi = dailyBriefingMissedMedVars(
      {
        childName: "रोहित",
        parentName: "कमला",
        callTime: "08:05",
        missedDoses: "शुगर की गोली (सुबह)",
      },
      "hi",
    );
    assert.deepEqual(hi, ["रोहित", "कमला", "8:05", "शुगर की गोली (सुबह)"]);
    assertPayload("daily_briefing_missed_med", "hi", hi);
  });

  it("daily_briefing_low_mood en and hi", () => {
    const en = dailyBriefingLowMoodVars(
      {
        childName: "Rohit",
        parentName: "Kamla",
        callTime: "08:05",
        quote: "Aaj mann nahi lag raha.",
      },
      "en",
    );
    assert.deepEqual(en, ["Rohit", "Kamla", "8:05 AM", "Aaj mann nahi lag raha."]);
    assertPayload("daily_briefing_low_mood", "en", en);

    const hi = dailyBriefingLowMoodVars(
      {
        childName: "रोहित",
        parentName: "कमला",
        callTime: "08:05",
        quote: "आज मन नहीं लग रहा।",
      },
      "hi",
    );
    assert.deepEqual(hi, ["रोहित", "कमला", "8:05", "आज मन नहीं लग रहा।"]);
    assertPayload("daily_briefing_low_mood", "hi", hi);
  });

  it("safety_alert_emergency en and hi, with desk URL and no neighbour or phone", () => {
    const en = safetyAlertEmergencyVars(
      {
        childName: "Rohit",
        parentName: "Kamla",
        quote: "Bathroom mein gir gayi, uth nahi pa rahi.",
        callTime: "08:09",
        deskUrl: DESK,
      },
      "en",
    );
    assert.deepEqual(en, [
      "Rohit",
      "Kamla",
      "Bathroom mein gir gayi, uth nahi pa rahi.",
      "8:09 AM",
      DESK,
    ]);
    assert.equal(en.includes("+919999999999"), false);
    assert.equal(en.some((v) => /Sunita|neighbour/i.test(v)), false);
    assertPayload("safety_alert_emergency", "en", en);

    const hi = safetyAlertEmergencyVars(
      {
        childName: "रोहित",
        parentName: "कमला",
        quote: "बाथरूम में गिर गई, उठ नहीं पा रही।",
        callTime: "08:09",
        deskUrl: DESK,
      },
      "hi",
    );
    assert.deepEqual(hi, ["रोहित", "कमला", "बाथरूम में गिर गई, उठ नहीं पा रही।", "8:09", DESK]);
    assertPayload("safety_alert_emergency", "hi", hi);
  });

  it("safety_alert_unreachable en and hi", () => {
    const en = safetyAlertUnreachableVars({
      childName: "Rohit",
      parentName: "Kamla",
      tryCount: 3,
      deskUrl: DESK,
    });
    assert.deepEqual(en, ["Rohit", "Kamla", "3", DESK]);
    assertPayload("safety_alert_unreachable", "en", en);

    const hi = safetyAlertUnreachableVars({
      childName: "रोहित",
      parentName: "कमला",
      tryCount: 3,
      deskUrl: DESK,
    });
    assert.deepEqual(hi, ["रोहित", "कमला", "3", DESK]);
    assertPayload("safety_alert_unreachable", "hi", hi);
  });

  it("never sends empty params: fallbacks, stripped quotes, 200-char cap", () => {
    assert.equal(templateCallTime("", "en"), "today");
    assert.equal(quoteParam("line\none\t tab"), "line one tab");
    assert.equal(quoteParam("x".repeat(250)).length, 200);
    const vars = dailyBriefingGoodVars(
      { childName: "  ", parentName: "", callTime: "", medicines: "\n", quote: "\t\n" },
      "en",
    );
    assert.deepEqual(vars, ["family", "your parent", "today", "today's medicines", "no quote"]);
    assert.equal(vars.every((v) => v.length > 0), true);
    assertPayload("daily_briefing_good", "en", vars);
  });
});
