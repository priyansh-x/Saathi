import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import sharp from "sharp";
import { ASSET_SPECS, assetSize, maskableSafeZone, renderBrandAssets } from "./build";

const tmp = mkdtempSync(path.join(tmpdir(), "saathi-brand-"));
after(() => rmSync(tmp, { recursive: true, force: true }));

describe("brand:build", () => {
  it("writes every required raster with a non-empty size", async () => {
    await renderBrandAssets({ dests: [tmp], writeTracked: false });
    for (const spec of ASSET_SPECS) {
      assert.ok(assetSize(spec.name, tmp) > 200, spec.name);
    }
    const mark = readFileSync(path.join(tmp, "mark.svg"), "utf8");
    assert.doesNotMatch(mark, /<text/i);
    assert.match(mark, /<path/);
  });

  it("keeps maskable artwork inside the 80% safe zone", async () => {
    await renderBrandAssets({ dests: [tmp], writeTracked: false });
    const png = readFileSync(path.join(tmp, "maskable-512.png"));
    const box = await maskableSafeZone(png);
    assert.ok(box.minX >= box.inset - 2, `minX ${box.minX}`);
    assert.ok(box.minY >= box.inset - 2, `minY ${box.minY}`);
    assert.ok(box.maxX <= box.width - box.inset + 2, `maxX ${box.maxX}`);
    assert.ok(box.maxY <= box.width - box.inset + 2, `maxY ${box.maxY}`);
  });

  it("keeps the 16 px counter open so terracotta from the tile edge reaches above the crossbar", async () => {
    await renderBrandAssets({ dests: [tmp], writeTracked: false });
    const png = readFileSync(path.join(tmp, "icon-16.png"));
    const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const w = info.width;
    const h = info.height;
    const ch = info.channels;
    const at = (x: number, y: number) => {
      const i = (y * w + x) * ch;
      return { r: data[i]!, g: data[i + 1]!, b: data[i + 2]!, a: data[i + 3]! };
    };
    const isPaper = (p: { r: number; g: number; b: number; a: number }) =>
      p.a > 16 && p.r > 210 && p.g > 210 && p.b > 210;
    const isTerracotta = (p: { r: number; g: number; b: number; a: number }) =>
      p.a > 16 && Math.abs(p.r - 176) < 40 && Math.abs(p.g - 83) < 40 && Math.abs(p.b - 42) < 40;

    let minX = w, minY = h, maxX = 0, maxY = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!isPaper(at(x, y))) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    assert.ok(maxX > minX && maxY > minY, "glyph bbox");

    const seen = new Uint8Array(w * h);
    const q: number[] = [];
    const push = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const idx = y * w + x;
      if (seen[idx]) return;
      const p = at(x, y);
      if (isPaper(p) || p.a < 16) return;
      if (!isTerracotta(p)) return;
      seen[idx] = 1;
      q.push(idx);
    };
    for (let x = 0; x < w; x++) {
      push(x, 0);
      push(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      push(0, y);
      push(w - 1, y);
    }
    for (let i = 0; i < q.length; i++) {
      const idx = q[i]!;
      const x = idx % w;
      const y = (idx / w) | 0;
      push(x + 1, y);
      push(x - 1, y);
      push(x, y + 1);
      push(x, y - 1);
    }

    const crossbarRow = minY + Math.max(2, Math.round((maxY - minY) * 0.45));
    let open = 0;
    for (let y = minY; y < crossbarRow; y++) {
      for (let x = minX; x <= maxX; x++) {
        const p = at(x, y);
        if (isTerracotta(p) && seen[y * w + x]) open++;
      }
    }
    assert.ok(open > 0, `open terracotta above crossbar row ${crossbarRow} in bbox ${minX},${minY}-${maxX},${maxY}`);
  });
});
