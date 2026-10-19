import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

function pngSize(buf: Buffer) {
  assert.equal(buf.toString("ascii", 1, 4), "PNG");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe("brand screens", () => {
  it("commits 1080×1920 captures", () => {
    const dir = path.join(process.cwd(), "public/brand/screens");
    for (const name of ["after-today-en.png", "after-home-en.png"]) {
      const size = pngSize(readFileSync(path.join(dir, name)));
      assert.equal(size.width, 1080, name);
      assert.equal(size.height, 1920, name);
    }
  });
});
