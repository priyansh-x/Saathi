import { mkdirSync, readFileSync, writeFileSync, copyFileSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const markPath = path.join(root, "public/brand/mark.svg");
const dests = [path.join(root, "public/brand"), path.join(root, "landing/public/brand")];

export const ASSET_SPECS = [
  { name: "icon-512.png", size: 512, pad: 0 },
  { name: "icon-192.png", size: 192, pad: 0 },
  { name: "maskable-512.png", size: 512, pad: 51 },
  { name: "maskable-192.png", size: 192, pad: 19 },
  { name: "apple-touch-icon.png", size: 180, pad: 0 },
  { name: "android-foreground-432.png", size: 432, pad: 72, transparent: true },
  { name: "android-background-432.png", size: 432, pad: 0, fillOnly: true },
  { name: "play-store-1024.png", size: 1024, pad: 96 },
  { name: "splash-mark.png", size: 512, pad: 80, paper: true },
  { name: "whatsapp-640.png", size: 640, pad: 80 },
  { name: "og-image.png", size: 1200, height: 630, pad: 180, paper: true },
] as const;

export async function renderBrandAssets() {
  const svg = readFileSync(markPath);
  for (const dest of dests) mkdirSync(dest, { recursive: true });
  copyFileSync(markPath, path.join(root, "public/brand/favicon.svg"));
  copyFileSync(markPath, path.join(root, "landing/public/brand/favicon.svg"));
  copyFileSync(markPath, path.join(root, "docs/saathi/brand/mark.svg"));

  for (const spec of ASSET_SPECS) {
    const h = "height" in spec && spec.height ? spec.height : spec.size;
    const paper = "paper" in spec && spec.paper;
    const transparent = "transparent" in spec && spec.transparent;
    const fillOnly = "fillOnly" in spec && spec.fillOnly;
    const bg = transparent ? { r: 0, g: 0, b: 0, alpha: 0 } : paper ? "#F7F5F0" : "#B0532A";
    const inner = Math.max(32, Math.min(spec.size, h) - spec.pad * 2);
    const mark = fillOnly
      ? Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${spec.size}" height="${spec.size}"><rect width="100%" height="100%" fill="#B0532A"/></svg>`)
      : await sharp(svg).resize(inner, inner).png().toBuffer();
    const composed = await sharp({
      create: { width: spec.size, height: h, channels: 4, background: bg },
    })
      .composite(fillOnly ? [] : [{ input: mark, gravity: "centre" }])
      .png()
      .toBuffer();
    for (const dest of dests) writeFileSync(path.join(dest, spec.name), composed);
  }

  const ico16 = await sharp(svg).resize(16, 16).png().toBuffer();
  const ico32 = await sharp(svg).resize(32, 32).png().toBuffer();
  for (const dest of dests) {
    writeFileSync(path.join(dest, "favicon.ico"), ico32);
    writeFileSync(path.join(dest, "icon-16.png"), ico16);
  }
}

/** Foreground (the स) vs terracotta fill. Maskable safe zone is the inner 80%. */
export function maskableSafeZone(png: Buffer) {
  return sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      let minX = info.width,
        minY = info.height,
        maxX = 0,
        maxY = 0;
      for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
          const i = (y * info.width + x) * info.channels;
          const r = data[i]!,
            g = data[i + 1]!,
            b = data[i + 2]!,
            a = data[i + 3]!;
          if (a < 16) continue;
          const terracotta = Math.abs(r - 176) < 30 && Math.abs(g - 83) < 30 && Math.abs(b - 42) < 30;
          if (terracotta) continue;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
      const inset = Math.round(info.width * 0.1);
      return { minX, minY, maxX, maxY, inset, width: info.width };
    });
}

export function assetSize(name: string) {
  return statSync(path.join(root, "public/brand", name)).size;
}

const isMain = /scripts\/brand\/build\.ts$/.test(process.argv[1] || "");
if (isMain) {
  renderBrandAssets()
    .then(() => console.log("Wrote public/brand and landing/public/brand"))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
