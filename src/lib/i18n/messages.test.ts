import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { messages } from "@/lib/i18n/messages";

describe("i18n keys", () => {
  it("keeps en and hi keys identical", () => {
    assert.deepEqual(Object.keys(messages.en).sort(), Object.keys(messages.hi).sort());
  });

  it("desk display copy has no em dash", () => {
    const keys = [
      "profileOpen",
      "profileHint",
      "profileGuideTitle",
      "profileGuide1",
      "profileGuide2",
      "profileGuide3",
      "profileGuide4",
      "profileWalk",
      "profileExampleNote",
      "themeSystem",
      "motionReduce",
    ] as const;
    for (const key of keys) {
      assert.equal(/[\u2013\u2014]/.test(messages.en[key]), false, key);
      assert.equal(/[\u2013\u2014]/.test(messages.hi[key]), false, key);
    }
  });
});
