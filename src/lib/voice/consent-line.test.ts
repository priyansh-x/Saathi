import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  injectConsentLines,
  loadConsentSpokenLines,
  parseConsentLineMarkdown,
} from "./consent-line";

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

  it("injects the Product file into the Bolna prompt", () => {
    const lines = loadConsentSpokenLines();
    const agent = JSON.parse(readFileSync(path.join(process.cwd(), "scripts/bolna/agent.json"), "utf8")) as {
      prompt: string;
    };
    const assembled = injectConsentLines(agent.prompt, lines);
    assert.match(assembled, /record_consent/);
    assert.ok(assembled.includes(lines.hi));
    assert.ok(assembled.includes(lines.en));
    assert.equal(assembled.includes("{{FIRST_CALL_CONSENT_HI}}"), false);
  });
});
