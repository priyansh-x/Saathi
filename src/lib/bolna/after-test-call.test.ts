import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deskCallHref } from "./after-test-call";

describe("deskCallHref", () => {
  it("opens the live call page so the family watches the transcript land", () => {
    assert.equal(
      deskCallHref("tok", "en", { ok: true, execution_id: "exec_live_1" }, "settings"),
      "/d/tok/calls/exec_live_1?lang=en&from=history&call=placed",
    );
    assert.equal(
      deskCallHref("tok", "hi", { ok: true, execution_id: "exec_live_1" }, "today"),
      "/d/tok/calls/exec_live_1?lang=hi&from=today&call=placed",
    );
  });

  it("stays on Settings when the ring could not be placed", () => {
    assert.equal(
      deskCallHref("tok", "en", { ok: false, reason: "paused" }, "settings"),
      "/d/tok/settings?lang=en&call=paused",
    );
  });
});
