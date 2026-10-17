import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { messages } from "@/lib/i18n/messages";

describe("i18n keys", () => {
  it("keeps en and hi keys identical", () => {
    assert.deepEqual(Object.keys(messages.en).sort(), Object.keys(messages.hi).sort());
  });
});
