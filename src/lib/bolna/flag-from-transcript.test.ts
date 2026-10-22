import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { flagFromTranscript } from "@/lib/bolna/flag-from-transcript";

describe("flagFromTranscript", () => {
  it("raises chest pain from a parent turn", () => {
    const flag = flagFromTranscript("assistant: Kaisi ho?\nuser: Seene mein dard ho raha hai.");
    assert.equal(flag?.category, "EMERGENCY");
    assert.match(flag?.quote || "", /Seene mein dard/);
  });

  it("raises chest pain from ASR 'sir senior mein dard'", () => {
    const flag = flagFromTranscript(
      JSON.stringify([{ speaker: "parent", hi: "sir senior में दर्द है", en: "sir senior में दर्द है" }]),
    );
    assert.equal(flag?.category, "EMERGENCY");
    assert.match(flag?.quote || "", /senior|दर्द|dard/i);
  });

  it("does not flag a denial", () => {
    const flag = flagFromTranscript("assistant: Seene mein dard?\nuser: Nahi, seene mein dard nahi hai.");
    assert.equal(flag, null);
  });

  it("ignores the agent's own wording", () => {
    const flag = flagFromTranscript("assistant: Agar seene mein dard ho to bataiye.\nuser: Theek hoon.");
    assert.equal(flag, null);
  });
});
