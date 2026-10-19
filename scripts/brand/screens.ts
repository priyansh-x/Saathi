import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE = process.env.FAMILY_BASE || process.env.AUDIT_BASE || "http://127.0.0.1:43180";
const dest = path.join(process.cwd(), "public/brand/screens");
const WIDTH = 1080;
const HEIGHT = 1920;

async function main() {
  mkdirSync(dest, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/d/example-kamla`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(dest, "after-today-en.png"), clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
  await page.goto(`${BASE}/onboard`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(dest, "after-home-en.png"), clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
  await browser.close();
  console.log(`Wrote ${WIDTH}x${HEIGHT} screens to ${dest}`);
}

const isMain = /scripts\/brand\/screens\.ts$/.test(process.argv[1] || "");
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
