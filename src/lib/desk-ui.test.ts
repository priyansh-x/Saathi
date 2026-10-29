import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  DEFAULT_DESK_UI,
  DESK_UI_BOOT,
  applyDeskUi,
  normalizeDeskUi,
} from "./desk-ui";

describe("desk appearance", () => {
  it("defaults to light paper, not dark and not the system scheme", () => {
    assert.equal(DEFAULT_DESK_UI.appearance, "light");
    assert.deepEqual(normalizeDeskUi(undefined), DEFAULT_DESK_UI);
    assert.equal(normalizeDeskUi({}).appearance, "light");
    assert.equal(normalizeDeskUi({ appearance: "light" }).appearance, "light");
    assert.equal(normalizeDeskUi({ density: "compact", look: "calm" }).appearance, "light");
  });

  it("keeps dark only when the family chose it", () => {
    assert.equal(normalizeDeskUi({ appearance: "dark" }).appearance, "dark");
    assert.equal(normalizeDeskUi({ appearance: "system" as "light" }).appearance, "light");
  });

  it("applies the dark class only for the opt-in, never from prefers-color-scheme", () => {
    const classList = {
      dark: false,
      toggle(_name: string, force?: boolean) {
        this.dark = Boolean(force);
      },
    };
    const root = { dataset: {} as Record<string, string>, classList, style: { colorScheme: "" } };
    const g = globalThis as unknown as { document?: { documentElement: typeof root } };
    const previous = g.document;
    g.document = { documentElement: root };
    try {
      applyDeskUi(DEFAULT_DESK_UI);
      assert.equal(classList.dark, false);
      assert.equal(root.dataset.appearance, "light");
      assert.equal(root.style.colorScheme, "light");

      applyDeskUi({ ...DEFAULT_DESK_UI, appearance: "dark" });
      assert.equal(classList.dark, true);
      assert.equal(root.dataset.appearance, "dark");
      assert.equal(root.style.colorScheme, "dark");
    } finally {
      g.document = previous;
    }
  });

  it("boots light unless localStorage already has appearance dark", () => {
    assert.match(DESK_UI_BOOT, /appearance==="dark"/);
    assert.match(DESK_UI_BOOT, /colorScheme=dark\?"dark":"light"/);
    assert.doesNotMatch(DESK_UI_BOOT, /prefers-color-scheme/);
    assert.match(DESK_UI_BOOT, /dataset\.appearance="light"/);
  });
});

describe("light stays the product default", () => {
  it("does not auto-darken from the OS in CSS, Android, or the layout boot", () => {
    const globals = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
    const landing = readFileSync(path.join(process.cwd(), "landing/app/globals.css"), "utf8");
    const styles = readFileSync(path.join(process.cwd(), "android/app/src/main/res/values/styles.xml"), "utf8");
    const layout = readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");
    const boot = readFileSync(path.join(process.cwd(), "src/components/pwa/boot.tsx"), "utf8");

    assert.match(globals, /color-scheme:\s*light/);
    assert.doesNotMatch(globals, /prefers-color-scheme:\s*dark/);
    const darkAt = globals.lastIndexOf("html.dark {");
    const rootAt = globals.indexOf(":root {");
    assert.ok(darkAt > rootAt, "dark tokens must override unlayered :root paper");
    assert.match(globals.slice(darkAt), /--paper:\s*#1d1b18/);
    assert.match(landing, /color-scheme:\s*light/);
    assert.doesNotMatch(landing, /prefers-color-scheme:\s*dark/);
    assert.match(styles, /Theme\.AppCompat\.Light\.NoActionBar/);
    assert.doesNotMatch(styles, /DayNight/);
    assert.match(styles, /forceDarkAllowed/);
    assert.match(boot, /DESK_UI_BOOT/);
    assert.match(layout, /PwaBoot/);
  });
});
