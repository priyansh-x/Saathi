import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

describe("brand tokens", () => {
  const css = readFileSync(path.join(process.cwd(), "src/brand/tokens.css"), "utf8");

  it("keeps indigo on paper with AA status colours", () => {
    assert.match(css, /--brand:\s*#34507a/i);
    assert.match(css, /--paper:\s*#f7f5f0/i);
    assert.match(css, /--ink:\s*#1d1b18/i);
    assert.match(css, /--good:\s*#1f6b45/i);
    assert.match(css, /--look:\s*#8a5410/i);
    assert.match(css, /--act:\s*#a83228/i);
    assert.match(css, /--ink-2:\s*#5a564f/i);
  });
});
