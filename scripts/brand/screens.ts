import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

const src = path.join(process.cwd(), "docs/saathi/brand/shots");
const dest = path.join(process.cwd(), "public/brand/screens");
mkdirSync(dest, { recursive: true });
if (existsSync(src)) {
  for (const name of readdirSync(src)) {
    if (!name.endsWith(".png")) continue;
    copyFileSync(path.join(src, name), path.join(dest, name));
  }
}
console.log(`Wrote ${dest}`);
