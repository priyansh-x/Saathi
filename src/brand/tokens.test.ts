import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)] as const;
}

function relativeLuminance([r, g, b]: readonly [number, number, number]) {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: string, b: string) {
  const L1 = relativeLuminance(hexToRgb(a));
  const L2 = relativeLuminance(hexToRgb(b));
  const light = Math.max(L1, L2);
  const dark = Math.min(L1, L2);
  return (light + 0.05) / (dark + 0.05);
}

describe("brand tokens", () => {
  const css = readFileSync(path.join(process.cwd(), "src/brand/tokens.css"), "utf8");

  it("keeps terracotta on cool paper with AA status colours", () => {
    assert.doesNotMatch(css, new RegExp("#" + "34507a", "i"));
    assert.match(css, /--brand:\s*#b0532a/i);
    assert.match(css, /--paper:\s*#f7f5f0/i);
    assert.match(css, /--ink:\s*#1d1b18/i);
    assert.match(css, /--good:\s*#276b43/i);
    assert.match(css, /--look:\s*#7a4f0e/i);
    assert.match(css, /--act:\s*#b23a2a/i);
    assert.match(css, /--ink-2:\s*#5c534a/i);
    assert.match(css, /--brand-text:\s*#8e3f1d/i);
  });

  it("keeps the landing copy of the same token values", () => {
    const landing = readFileSync(path.join(process.cwd(), "landing/brand/tokens.css"), "utf8");
    for (const name of ["brand", "paper", "ink", "good", "look", "act", "ink-2", "brand-text"]) {
      const re = new RegExp(`--${name}:\\s*(#[0-9a-f]+)`, "i");
      const a = css.match(re)?.[1];
      const b = landing.match(re)?.[1];
      assert.equal(a, b, name);
    }
  });

  it("brand-text meets 4.5:1 on paper for small terracotta type", () => {
    const ratio = contrast("#8e3f1d", "#f7f5f0");
    assert.ok(ratio >= 4.5, `contrast ${ratio}`);
  });
});
