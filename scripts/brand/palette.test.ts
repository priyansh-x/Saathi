import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import sharp from "sharp";

const root = process.cwd();
const FORBIDDEN = [
  new RegExp("#" + "34507a", "i"),
  new RegExp("#" + "2a4267", "i"),
  new RegExp("rgba\\(\\s*42\\s*,\\s*66\\s*,\\s*103", "i"),
  new RegExp("#" + "1a222e", "i"),
  new RegExp("#" + "243044", "i"),
];
const ROOTS = ["src", "landing", "public", "docs/saathi/brand", "scripts/brand", "android/app/src/main/res"];

function walk(dir: string, out: string[] = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === "generated") continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function rgbToLab(r: number, g: number, b: number) {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const R = lin(r),
    G = lin(g),
    B = lin(b);
  const x = R * 0.4124 + G * 0.3576 + B * 0.1805;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = R * 0.0193 + G * 0.1192 + B * 0.9505;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x / 0.95047),
    fy = f(y),
    fz = f(z / 1.08883);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

function deltaE(a: { L: number; a: number; b: number }, b: { L: number; a: number; b: number }) {
  return Math.hypot(a.L - b.L, a.a - b.a, a.b - b.b);
}

const INDIGO = rgbToLab(0x34, 0x50, 0x7a);
const NAVY = rgbToLab(0x2a, 0x42, 0x67);

describe("no leftover indigo or navy", () => {
  it("forbids indigo/navy hex in source trees", () => {
    const files = ROOTS.flatMap((dir) => walk(path.join(root, dir))).filter((f) =>
      /\.(svg|css|tsx|ts|html|xml|md|ico)?$/.test(f),
    );
    for (const file of files) {
      if (/\.(png|jpg|jpeg|ico|webp)$/i.test(file)) continue;
      const text = readFileSync(file, "utf8");
      for (const re of FORBIDDEN) {
        assert.equal(re.test(text), false, `${file} matches ${re}`);
      }
    }
  });

  it("committed rasters are not indigo/navy-dominant", async () => {
    const dirs = ["public", "landing/public", "docs/saathi/brand", "android/app/src/main/res"];
    const files = dirs.flatMap((dir) => walk(path.join(root, dir))).filter((f) => /\.png$/i.test(f));
    for (const file of files) {
      const { dominant } = await sharp(readFileSync(file)).stats();
      const r = dominant.r,
        g = dominant.g,
        b = dominant.b;
      const nearWhite = r > 230 && g > 230 && b > 230;
      if (nearWhite) continue;
      const lab = rgbToLab(r, g, b);
      assert.ok(deltaE(lab, INDIGO) > 10, `${file} dominant near indigo ${r},${g},${b}`);
      assert.ok(deltaE(lab, NAVY) > 10, `${file} dominant near navy ${r},${g},${b}`);
    }
  });
});
