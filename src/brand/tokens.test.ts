import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

describe("brand tokens", () => {
  const css = readFileSync(path.join(process.cwd(), "src/brand/tokens.css"), "utf8");

  it("keeps terracotta on paper with AA status colours", () => {
    assert.doesNotMatch(css, /#34507a/i);
    assert.match(css, /--brand:\s*#b0532a/i);
    assert.match(css, /--paper:\s*#fbf7f2/i);
    assert.match(css, /--ink:\s*#1f1b16/i);
    assert.match(css, /--good:\s*#276b43/i);
    assert.match(css, /--look:\s*#7a4f0e/i);
    assert.match(css, /--act:\s*#b23a2a/i);
    assert.match(css, /--ink-2:\s*#5c534a/i);
  });

  it("keeps the landing copy of the same token values", () => {
    const landing = readFileSync(path.join(process.cwd(), "landing/brand/tokens.css"), "utf8");
    for (const name of ["brand", "paper", "ink", "good", "look", "act", "ink-2"]) {
      const re = new RegExp(`--${name}:\\s*(#[0-9a-f]+)`, "i");
      const a = css.match(re)?.[1];
      const b = landing.match(re)?.[1];
      assert.equal(a, b, name);
    }
  });
});
