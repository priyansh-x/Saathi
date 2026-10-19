import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { ASSET_SPECS, assetSize, maskableSafeZone, renderBrandAssets } from "./build";

describe("brand:build", () => {
  it("writes every required raster with a non-empty size", async () => {
    await renderBrandAssets();
    for (const spec of ASSET_SPECS) {
      assert.ok(assetSize(spec.name) > 200, spec.name);
    }
    const mark = readFileSync(path.join(process.cwd(), "public/brand/mark.svg"), "utf8");
    assert.doesNotMatch(mark, /<text/i);
    assert.match(mark, /<path/);
  });

  it("keeps maskable artwork inside the 80% safe zone", async () => {
    await renderBrandAssets();
    const png = readFileSync(path.join(process.cwd(), "public/brand/maskable-512.png"));
    const box = await maskableSafeZone(png);
    assert.ok(box.minX >= box.inset - 2, `minX ${box.minX}`);
    assert.ok(box.minY >= box.inset - 2, `minY ${box.minY}`);
    assert.ok(box.maxX <= box.width - box.inset + 2, `maxX ${box.maxX}`);
    assert.ok(box.maxY <= box.width - box.inset + 2, `maxY ${box.maxY}`);
  });
});
