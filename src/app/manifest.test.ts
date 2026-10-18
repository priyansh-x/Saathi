import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import manifest, { PWA_VIEWPORT } from "./manifest";

describe("PWA", () => {
  it("ships a standalone portrait manifest sized for 360×740", () => {
    const m = manifest();
    assert.equal(m.display, "standalone");
    assert.equal(m.name, "Saathi");
    assert.equal(m.start_url, "/");
    assert.equal(m.orientation, "portrait");
    assert.equal(PWA_VIEWPORT.width, 360);
    assert.equal(PWA_VIEWPORT.height, 740);
    assert.ok((m.icons ?? []).some((i) => i.src === "/icon.svg"));
  });

  it("registers a same-origin service worker that skips /api", () => {
    const sw = readFileSync(path.join(process.cwd(), "public/sw.js"), "utf8");
    assert.match(sw, /skipWaiting/);
    assert.match(sw, /\/api\//);
  });
});
