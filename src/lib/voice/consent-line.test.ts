import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { promptVariables } from "../bolna/summary";
import { closeDb, query } from "../db/client";
import { seed } from "../db/seed";
import { recordNeighbourReply } from "../neighbour";
import {
  fillConsentSpokenLine,
  injectConsentLines,
  parseConsentLineMarkdown,
} from "./consent-line";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";

const names = {
  parent_name: "Kamla",
  child_name: "Rohit",
  neighbour_name: "Sunita",
};

const fixtureHi =
  "{{parent_name}}, मैं साथी हूँ। {{child_name}} ने रखा है। पड़ोसन {{neighbour_name}} पास में हैं। हाँ बोलिए।";
const fixtureEn =
  "{parent_name}, this is Saathi. {child_name} asked me to call. Neighbour {neighbour_name} is nearby. Please say yes or no.";

function assertFilled(text: string) {
  assert.equal(/\{[a-z_]+\}/.test(text), false, text);
  assert.match(text, /112/);
  assert.match(text, /Rohit/);
  assert.match(text, /short update|छोटा सा हाल/);
}

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("first-call consent line source", () => {
  it("parses Hindi and English spoken lines from a fixture", () => {
    const md = [
      "# draft",
      "",
      "**Hindi (spoken):**",
      "«Maa, एक पंक्ति।»",
      "",
      "**English (spoken):**",
      '"Maa, one line."',
      "",
    ].join("\n");
    assert.deepEqual(parseConsentLineMarkdown(md), {
      hi: "Maa, एक पंक्ति।",
      en: "Maa, one line.",
    });
  });

  it("fills parent, child, and neighbour names when a neighbour is set up", () => {
    const hi = fillConsentSpokenLine(fixtureHi, names);
    const en = fillConsentSpokenLine(fixtureEn, names);
    assert.match(hi, /Kamla/);
    assert.match(hi, /Rohit/);
    assert.match(hi, /Sunita/);
    assert.match(en, /Kamla/);
    assert.match(en, /Rohit/);
    assert.match(en, /Sunita/);
  });

  it("drops the neighbour clause when no neighbour is set up", () => {
    const empty = { ...names, neighbour_name: "" };
    const hi = fillConsentSpokenLine(fixtureHi, empty);
    const en = fillConsentSpokenLine(fixtureEn, empty);
    assert.match(hi, /Kamla/);
    assert.match(hi, /Rohit/);
    assert.match(hi, /हाँ बोलिए/);
    assert.doesNotMatch(hi, /Sunita/);
    assert.doesNotMatch(hi, /पड़ोसन/);
    assert.doesNotMatch(hi, /neighbour_name/);
    assert.match(en, /Kamla/);
    assert.match(en, /Rohit/);
    assert.match(en, /Please say yes or no/);
    assert.doesNotMatch(en, /Sunita/);
    assert.doesNotMatch(en, /Neighbour/);
    assert.doesNotMatch(en, /neighbour_name/);
  });

  it("fills the Product file from the parent record", async () => {
    const agent = JSON.parse(readFileSync(path.join(process.cwd(), "scripts/bolna/agent.json"), "utf8")) as {
      prompt: string;
    };
    const assembled = injectConsentLines(agent.prompt);
    assert.match(assembled, /\{\{consent_line_hi\}\}/);
    assert.match(assembled, /record_consent/);

    const vars = await promptVariables("parent_kamla");
    assertFilled(vars.consent_line_en);
    assertFilled(vars.consent_line_hi);
    assert.equal(vars.neighbour_name, "Sunita");
    assert.match(vars.consent_line_en, /Sunita/);

    await recordNeighbourReply("parent_kamla", false);
    const declined = await promptVariables("parent_kamla");
    assert.equal(declined.neighbour_name, "");
    assertFilled(declined.consent_line_en);
    assertFilled(declined.consent_line_hi);
    assert.doesNotMatch(declined.consent_line_en, /Sunita/);
    assert.doesNotMatch(declined.consent_line_hi, /Sunita/);

    await query(`delete from contacts where id = 'contact_sunita'`);
    const without = await promptVariables("parent_kamla");
    assert.equal(without.neighbour_name, "");
    assertFilled(without.consent_line_en);
    assertFilled(without.consent_line_hi);
    assert.doesNotMatch(without.consent_line_en, /Sunita/);
    assert.doesNotMatch(without.consent_line_hi, /Sunita/);
  });
});
