import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DESK_UI_BOOT, parseDeskUi, themeIsDark } from "@/lib/desk-ui";

describe("desk display prefs", () => {
  it("fills safe defaults and rejects unknown values", () => {
    assert.deepEqual(parseDeskUi(null), {
      density: "comfortable",
      look: "warm",
      theme: "system",
      typeSize: "regular",
      motion: "full",
    });
    assert.equal(parseDeskUi({ density: "compact", look: "calm", theme: "dark", typeSize: "large", motion: "reduce" }).theme, "dark");
    assert.equal(parseDeskUi({ theme: "neon", typeSize: "huge" }).theme, "system");
    assert.equal(parseDeskUi({ theme: "neon", typeSize: "huge" }).typeSize, "regular");
  });

  it("treats system as dark only when the phone is dark", () => {
    assert.equal(themeIsDark("light", true), false);
    assert.equal(themeIsDark("dark", false), true);
    assert.equal(themeIsDark("system", true), true);
    assert.equal(themeIsDark("system", false), false);
  });

  it("boot script never mentions a live pharmacy or an em dash", () => {
    assert.equal(/[\u2013\u2014]/.test(DESK_UI_BOOT), false);
    assert.equal(/1mg|PharmEasy|Netmeds|Apollo|Truemeds/i.test(DESK_UI_BOOT), false);
    assert.match(DESK_UI_BOOT, /saathi-desk-ui/);
  });
});
