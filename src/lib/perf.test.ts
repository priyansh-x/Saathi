import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

describe("performance", () => {
  it("subsets fonts: latin Plex/serif, Devanagari Plex, no extra preloads", () => {
    const layout = read("src/app/layout.tsx");
    assert.match(layout, /Inter\(\{[\s\S]*subsets:\s*\["latin"\][\s\S]*preload:\s*false/);
    assert.match(layout, /Instrument_Serif\(\{[\s\S]*subsets:\s*\["latin"\][\s\S]*preload:\s*false/);
    assert.match(layout, /Noto_Sans_Devanagari\(\{[\s\S]*subsets:\s*\["devanagari"\][\s\S]*preload:\s*false/);
  });

  it("sizes next/image on the desk avatar and neighbour thumb", () => {
    const chrome = read("src/components/family/chrome.tsx");
    assert.match(chrome, /sizes=\{`\$\{size\}px`\}/);
    const settings = read("src/components/family/settings-panel.tsx");
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
    assert.match(layout, /AppStyles/);
    assert.doesNotMatch(layout, /PwaRegister/);
    assert.doesNotMatch(layout, /import ["']\.\/globals\.css["']/);
  });

  it("does not block call or alert screens on Bolna network pulls", () => {
    const call = read("src/app/d/[token]/calls/[id]/page.tsx");
    assert.doesNotMatch(call, /hydrateBolnaCall/);
    assert.doesNotMatch(call, /syncDeskFromBolna/);
    assert.doesNotMatch(call, /backfillAlertsFromTranscripts/);
    const alert = read("src/app/d/[token]/alerts/[id]/page.tsx");
    assert.doesNotMatch(alert, /loadFamily/);
    const desk = read("src/components/family/desk-screen.tsx");
    assert.match(desk, /hydrateBolna:\s*false/);
    const history = read("src/components/family/history-panel.tsx");
    assert.doesNotMatch(history, /syncDeskFromBolna/);
  });
});
