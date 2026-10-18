import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

describe("performance", () => {
  it("subsets fonts: latin Inter/serif, Devanagari Noto, no extra preloads", () => {
    const layout = read("src/app/layout.tsx");
    assert.match(layout, /Inter\(\{[\s\S]*subsets:\s*\["latin"\]/);
    assert.match(layout, /Instrument_Serif\(\{[\s\S]*subsets:\s*\["latin"\][\s\S]*preload:\s*false/);
    assert.match(layout, /Noto_Sans_Devanagari\(\{[\s\S]*subsets:\s*\["devanagari"\][\s\S]*preload:\s*false/);
  });

  it("sizes next/image on the desk avatar and neighbour thumb", () => {
    const chrome = read("src/components/family/chrome.tsx");
    assert.match(chrome, /sizes=\{`\$\{size\}px`\}/);
    const settings = read("src/app/d/[token]/settings/page.tsx");
    assert.match(settings, /sizes="72px"/);
  });

  it("keeps Today, Alerts, and History free of client components", () => {
    for (const rel of [
      "src/app/d/[token]/page.tsx",
      "src/app/d/[token]/alerts/page.tsx",
      "src/app/d/[token]/history/page.tsx",
    ]) {
      const src = read(rel);
      assert.doesNotMatch(src, /["']use client["']/);
      assert.doesNotMatch(src, /from ["']@\/components\/pwa\/register["']/);
      assert.doesNotMatch(src, /from ["']@\/components\/ui\//);
    }
    const layout = read("src/app/layout.tsx");
    assert.match(layout, /PwaBoot/);
    assert.doesNotMatch(layout, /PwaRegister/);
  });
});
