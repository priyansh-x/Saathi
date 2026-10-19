import { mkdirSync, writeFileSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { MARK_GLYPH, MARK_PATH, MARK_TILE, markSvgMarkup } from "../../src/lib/brand";

const root = process.cwd();
const defaultDests = [path.join(root, "public/brand"), path.join(root, "landing/public/brand")];

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

function writeMarkFiles(dests: string[], writeTracked: boolean) {
  const master = markSvgMarkup();
  const mono = markSvgMarkup({ mono: true });
  for (const dest of dests) {
    mkdirSync(dest, { recursive: true });
    writeFileSync(path.join(dest, "mark.svg"), master);
    writeFileSync(path.join(dest, "favicon.svg"), master);
  }
  if (writeTracked) {
    writeFileSync(path.join(root, "public/brand/mark.svg"), master);
    writeFileSync(path.join(root, "landing/public/brand/mark.svg"), master);
    writeFileSync(path.join(root, "docs/saathi/brand/mark.svg"), master);
    writeFileSync(path.join(root, "public/icon.svg"), master);
    writeFileSync(path.join(root, "docs/saathi/brand/mark-mono.svg"), mono);
    writeFileSync(path.join(root, "public/brand/favicon.svg"), master);
    writeFileSync(path.join(root, "landing/public/brand/favicon.svg"), master);
    writeFileSync(
      path.join(root, "landing/lib/mark-path.ts"),
      `/** Generated from src/lib/brand.ts — do not edit by hand. */\nexport const MARK_TILE = ${JSON.stringify(MARK_TILE)};\nexport const MARK_GLYPH = ${JSON.stringify(MARK_GLYPH)};\nexport const MARK_PATH = ${JSON.stringify(MARK_PATH)};\n`,
    );
    writeLockups();
  }
  return { master };
}

function writeLockups() {
  const tile = `<svg x="4" y="4" width="64" height="64" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${MARK_TILE}"/><path fill="${MARK_GLYPH}" d="${MARK_PATH}"/></svg>`;
  const stackedTile = `<svg x="48" y="8" width="64" height="64" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${MARK_TILE}"/><path fill="${MARK_GLYPH}" d="${MARK_PATH}"/></svg>`;
  const dir = path.join(root, "docs/saathi/brand/lockups");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    path.join(dir, "horizontal-en.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 72" role="img" aria-label="Saathi horizontal lockup">\n  ${tile}\n  <text x="84" y="48" fill="#1D1B18" font-family="Inter, Noto Sans, sans-serif" font-size="36" font-weight="600" letter-spacing="-0.03em">Saathi</text>\n</svg>\n`,
  );
  writeFileSync(
    path.join(dir, "horizontal-hi.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 72" role="img" aria-label="साथी horizontal lockup">\n  ${tile}\n  <text x="84" y="50" fill="#1D1B18" font-family="Noto Sans Devanagari, sans-serif" font-size="36" font-weight="600">साथी</text>\n</svg>\n`,
  );
  writeFileSync(
    path.join(dir, "stacked-en.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="Saathi stacked lockup">\n  ${stackedTile}\n  <text x="80" y="120" text-anchor="middle" fill="#1D1B18" font-family="Inter, Noto Sans, sans-serif" font-size="32" font-weight="600" letter-spacing="-0.03em">Saathi</text>\n</svg>\n`,
  );
  writeFileSync(
    path.join(dir, "stacked-hi.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="साथी stacked lockup">\n  ${stackedTile}\n  <text x="80" y="128" text-anchor="middle" fill="#1D1B18" font-family="Noto Sans Devanagari, sans-serif" font-size="34" font-weight="600">साथी</text>\n</svg>\n`,
  );
  writeFileSync(
    path.join(dir, "wordmark-en.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 64" role="img" aria-label="Saathi wordmark">\n  <text x="0" y="46" fill="#1D1B18" font-family="Inter, Noto Sans, sans-serif" font-size="42" font-weight="600" letter-spacing="-0.03em">Saathi</text>\n</svg>\n`,
  );
  writeFileSync(
    path.join(dir, "wordmark-hi.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 64" role="img" aria-label="साथी wordmark">\n  <text x="0" y="52" fill="#1D1B18" font-family="Noto Sans Devanagari, sans-serif" font-size="44" font-weight="600">साथी</text>\n</svg>\n`,
  );
}

function rasterSvg(markup: string, size: number) {
  const sized = markup.replace(
    'viewBox="0 0 512 512"',
    `width="${size}" height="${size}" viewBox="0 0 512 512"`,
  );
  return sharp(Buffer.from(sized)).png().toBuffer();
}

export async function renderBrandAssets(opts?: { dests?: string[]; writeTracked?: boolean }) {
  const dests = opts?.dests ?? defaultDests;
  const writeTracked = opts?.writeTracked ?? !opts?.dests;
  const { master } = writeMarkFiles(dests, writeTracked);

  for (const spec of ASSET_SPECS) {
    const h = "height" in spec && spec.height ? spec.height : spec.size;
    const paper = "paper" in spec && spec.paper;
    const transparent = "transparent" in spec && spec.transparent;
    const fillOnly = "fillOnly" in spec && spec.fillOnly;
    const bg = transparent ? { r: 0, g: 0, b: 0, alpha: 0 } : paper ? "#F7F5F0" : "#B0532A";
    const inner = Math.max(32, Math.min(spec.size, h) - spec.pad * 2);
    const mark = fillOnly
      ? Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${spec.size}" height="${spec.size}"><rect width="100%" height="100%" fill="#B0532A"/></svg>`)
      : await rasterSvg(master, inner);
    const composed = await sharp({
      create: { width: spec.size, height: h, channels: 4, background: bg },
    })
      .composite(fillOnly ? [] : [{ input: mark, gravity: "centre" }])
      .png()
      .toBuffer();
    for (const dest of dests) writeFileSync(path.join(dest, spec.name), composed);
  }

  const ico16 = await rasterSvg(master, 16);
  const ico32 = await rasterSvg(master, 32);
  const ico48 = await rasterSvg(master, 48);
  const ico = packPngIco([
    { size: 16, png: ico16 },
    { size: 32, png: ico32 },
    { size: 48, png: ico48 },
  ]);
  for (const dest of dests) {
    writeFileSync(path.join(dest, "favicon.ico"), ico);
    writeFileSync(path.join(dest, "icon-16.png"), ico16);
  }
  if (!writeTracked) return;

  writeFileSync(path.join(root, "public/favicon.ico"), ico);

  const review = path.join(root, "docs/saathi/brand/identity_review");
  mkdirSync(review, { recursive: true });
  writeFileSync(path.join(review, "mark-16.png"), ico16);
  writeFileSync(path.join(review, "mark-32.png"), ico32);
  writeFileSync(path.join(review, "mark-48.png"), ico48);
  writeFileSync(path.join(review, "mark-512.png"), await rasterSvg(master, 512));

  const sheet = await renderBrandSheet(ico16, ico32, ico48);
  writeFileSync(path.join(root, "docs/saathi/brand/brand-sheet.png"), sheet);

  const androidRes = path.join(root, "android/app/src/main/res");
  const launcher = [
    ["mdpi", 48],
    ["hdpi", 72],
    ["xhdpi", 96],
    ["xxhdpi", 144],
    ["xxxhdpi", 192],
  ] as const;
  for (const [density, size] of launcher) {
    const dir = path.join(androidRes, `mipmap-${density}`);
    mkdirSync(dir, { recursive: true });
    const png = await rasterSvg(master, size);
    writeFileSync(path.join(dir, "ic_launcher.png"), png);
    writeFileSync(path.join(dir, "ic_launcher_round.png"), png);
    writeFileSync(path.join(dir, "ic_launcher_foreground.png"), png);
  }
  const splash = await rasterSvg(master, 288);
  for (const folder of ["drawable", "drawable-port-mdpi", "drawable-land-mdpi"]) {
    const dir = path.join(androidRes, folder);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "splash.png"), splash);
  }
}

/** Real ICO with PNG payloads (16/32/48). */
export function packPngIco(images: { size: number; png: Buffer }[]) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = Buffer.alloc(16 * images.length);
  let offset = 6 + 16 * images.length;
  const bodies: Buffer[] = [];
  images.forEach((image, i) => {
    const entry = entries.subarray(i * 16, i * 16 + 16);
    entry[0] = image.size >= 256 ? 0 : image.size;
    entry[1] = image.size >= 256 ? 0 : image.size;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(image.png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += image.png.length;
    bodies.push(image.png);
  });
  return Buffer.concat([header, entries, ...bodies]);
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

async function renderBrandSheet(m16: Buffer, m32: Buffer, m48: Buffer) {
  const m128 = await rasterSvg(markSvgMarkup(), 128);
  const m64 = await rasterSvg(markSvgMarkup(), 64);
  const swatches: { hex: string; x: number }[] = [
    { hex: "#B0532A", x: 80 },
    { hex: "#F7F5F0", x: 320 },
    { hex: "#1D1B18", x: 560 },
    { hex: "#276B43", x: 800 },
    { hex: "#7A4F0E", x: 1040 },
    { hex: "#B23A2A", x: 1280 },
  ];
  const swatchPngs = await Promise.all(
    swatches.map((s) =>
      sharp({ create: { width: 200, height: 120, channels: 4, background: s.hex } })
        .png()
        .toBuffer()
        .then((buf) => ({ input: buf, left: s.x, top: 520 })),
    ),
  );
  return sharp({
    create: { width: 1600, height: 2200, channels: 4, background: "#F7F5F0" },
  })
    .composite([
      { input: m128, left: 80, top: 160 },
      { input: m64, left: 240, top: 192 },
      { input: m48, left: 340, top: 200 },
      { input: m32, left: 420, top: 208 },
      { input: m16, left: 480, top: 216 },
      ...swatchPngs,
    ])
    .png()
    .toBuffer();
}

export function assetSize(name: string, dir = path.join(root, "public/brand")) {
  return statSync(path.join(dir, name)).size;
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
