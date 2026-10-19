import { chromium } from "playwright";
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.join(import.meta.dirname, "../..");
const markSvg = await readFile(path.join(root, "docs/saathi/brand/mark.svg"), "utf8");
const paper = "#F7F5F0";
const brand = "#34507A";

async function pngFromHtml(page, html, file, w, h, omitBackground = false) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: file, type: "png", omitBackground });
}

function iconHtml({ size, bg, pad = 0, radius = 0, circle = false }) {
  const inner = size - pad * 2;
  const clip = circle
    ? `border-radius:50%;overflow:hidden`
    : radius
      ? `border-radius:${radius}px;overflow:hidden`
      : "";
  return `<!doctype html><html><body style="margin:0;background:${bg}">
    <div style="width:${size}px;height:${size}px;background:${bg};${clip};display:grid;place-items:center">
      <div style="width:${inner}px;height:${inner}px">${markSvg}</div>
    </div></body></html>`;
}

function icoFromPngs(pngs) {
  // PNG-in-ICO (Vista+)
  const count = pngs.length;
  const header = Buffer.alloc(6 + count * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  let offset = 6 + count * 16;
  const chunks = [header];
  pngs.forEach((png, i) => {
    const dim = [16, 32, 48][i];
    const ent = 6 + i * 16;
    header.writeUInt8(dim, ent);
    header.writeUInt8(dim, ent + 1);
    header.writeUInt8(0, ent + 2);
    header.writeUInt8(0, ent + 3);
    header.writeUInt16LE(1, ent + 4);
    header.writeUInt16LE(32, ent + 6);
    header.writeUInt32LE(png.length, ent + 8);
    header.writeUInt32LE(offset, ent + 12);
    chunks.push(png);
    offset += png.length;
  });
  return Buffer.concat(chunks);
}

const dests = [
  path.join(root, "public/brand"),
  path.join(root, "landing/public/brand"),
];
for (const d of dests) await mkdir(d, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

const jobs = [
  { name: "icon-512.png", size: 512, pad: 0, radius: 112 },
  { name: "icon-192.png", size: 192, pad: 0, radius: 42 },
  { name: "maskable-512.png", size: 512, pad: 51 },
  { name: "maskable-192.png", size: 192, pad: 19 },
  { name: "apple-touch-icon.png", size: 180, pad: 0 },
  { name: "android-foreground-432.png", size: 432, pad: 72, bg: "transparent", omitBackground: true },
  { name: "play-store-1024.png", size: 1024, pad: 96, radius: 220 },
  { name: "splash-mark.png", size: 512, pad: 80, bg: paper },
  { name: "whatsapp-640.png", size: 640, pad: 80, circle: true },
];

for (const job of jobs) {
  const bg = job.bg ?? brand;
  const size = job.size;
  await pngFromHtml(
    page,
    iconHtml({ size, bg: bg === "transparent" ? "rgba(0,0,0,0)" : bg, pad: job.pad ?? 0, radius: job.radius ?? 0, circle: job.circle }),
    path.join(dests[0], job.name),
    size,
    size,
    Boolean(job.omitBackground),
  );
}

// background layer solid
await pngFromHtml(
  page,
  `<!doctype html><html><body style="margin:0;background:${brand};width:432px;height:432px"></body></html>`,
  path.join(dests[0], "android-background-432.png"),
  432,
  432,
);

const og = `<!doctype html><html><body style="margin:0">
<div style="width:1200px;height:630px;background:${paper};display:flex;flex-direction:column;justify-content:center;padding:72px 80px;font-family:'IBM Plex Sans',system-ui,sans-serif;color:${"#1D1B18"}">
  <div style="display:flex;align-items:center;gap:18px">
    <div style="width:72px;height:72px">${markSvg}</div>
    <div style="font-size:40px;font-weight:600;letter-spacing:-0.03em">Saathi</div>
  </div>
  <div style="margin-top:36px;font-size:48px;font-weight:600;letter-spacing:-0.03em;max-width:16ch;line-height:1.15">A morning call for Maa, on the phone she has.</div>
  <div style="margin-top:18px;font-size:22px;color:#5A564F;max-width:36ch">Two calm lines on WhatsApp. Companionship and reminders — never a doctor.</div>
</div></body></html>`;
await pngFromHtml(page, og, path.join(dests[0], "og-image.png"), 1200, 630);

const fav16 = path.join(dests[0], "_fav16.png");
const fav32 = path.join(dests[0], "_fav32.png");
const fav48 = path.join(dests[0], "_fav48.png");
await pngFromHtml(page, iconHtml({ size: 16, bg: brand, radius: 4 }), fav16, 16, 16);
await pngFromHtml(page, iconHtml({ size: 32, bg: brand, radius: 8 }), fav32, 32, 32);
await pngFromHtml(page, iconHtml({ size: 48, bg: brand, radius: 10 }), fav48, 48, 48);
const ico = icoFromPngs([await readFile(fav16), await readFile(fav32), await readFile(fav48)]);
await writeFile(path.join(dests[0], "favicon.ico"), ico);
for (const tmp of [fav16, fav32, fav48]) await (await import("node:fs/promises")).unlink(tmp);

await copyFile(path.join(root, "docs/saathi/brand/mark.svg"), path.join(dests[0], "favicon.svg"));

const sheetUrl = pathToFileURL(path.join(root, "scripts/brand/sheet.html")).href;
await page.setViewportSize({ width: 1600, height: 2200 });
await page.goto(sheetUrl, { waitUntil: "networkidle" });
const sheet = page.locator("#sheet");
await sheet.screenshot({ path: path.join(root, "docs/saathi/brand/brand-sheet.png"), type: "png" });

for (const name of [
  "icon-512.png",
  "icon-192.png",
  "maskable-512.png",
  "maskable-192.png",
  "apple-touch-icon.png",
  "android-foreground-432.png",
  "android-background-432.png",
  "play-store-1024.png",
  "splash-mark.png",
  "whatsapp-640.png",
  "og-image.png",
  "favicon.ico",
  "favicon.svg",
]) {
  await copyFile(path.join(dests[0], name), path.join(dests[1], name));
}

await browser.close();
console.log("brand assets written");
