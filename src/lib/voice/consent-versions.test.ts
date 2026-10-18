import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  fillConsentSpokenLines,
  loadConsentSpokenVersions,
  pickConsentSpokenLines,
} from "./consent-line";

const names = {
  parent_name: "Kamla",
  child_name: "Rohit",
  neighbour_name: "Sunita",
};

function assertFilled(text: string) {
  assert.equal(/\{[a-z_]+\}/.test(text), false, text);
  assert.match(text, /112/);
  assert.match(text, /Rohit/);
  assert.match(text, /short update|छोटा सा हाल/);
}

describe("consent spoken versions", () => {
  it("picks with-neighbour and without-neighbour Product lines", () => {
    const versions = loadConsentSpokenVersions();
    const withN = fillConsentSpokenLines(pickConsentSpokenLines(versions, true), names);
    const solo = fillConsentSpokenLines(pickConsentSpokenLines(versions, false), {
      ...names,
      neighbour_name: "",
    });
    assertFilled(withN.hi);
    assertFilled(withN.en);
    assertFilled(solo.hi);
    assertFilled(solo.en);
    assert.match(withN.en, /Sunita/);
    assert.match(withN.hi, /Sunita/);
    assert.equal(solo.en.includes("Sunita"), false, solo.en);
    assert.equal(solo.hi.includes("Sunita"), false, solo.hi);
    assert.ok(solo.en.includes("a short update goes to Rohit"));
    assert.ok(solo.hi.includes("Rohit") && solo.hi.includes("भेजा जाता है"));
  });
});
