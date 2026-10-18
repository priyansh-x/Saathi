import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  CLEAR_CACHE_MESSAGE,
  DESK_MAX_AGE_MS,
  SW_VERSION,
  clearOfflineCaches,
  isCacheFresh,
  isDeskPath,
  lastUpdatedBanner,
  shouldCacheRequest,
} from "./offline";

describe("offline cache", () => {
  it("skips /api, keeps desk HTML, and expires desk pages after 24 hours", () => {
    assert.equal(shouldCacheRequest("/d/example-kamla", "GET"), true);
    assert.equal(shouldCacheRequest("/icon.svg", "GET"), true);
    assert.equal(shouldCacheRequest("/api/cron/tick", "GET"), false);
    assert.equal(shouldCacheRequest("/d/example-kamla", "POST"), false);
    assert.equal(isDeskPath("/d/example-kamla"), true);
    assert.equal(isDeskPath("/onboard"), false);
    const now = 1_700_000_000_000;
    assert.equal(isCacheFresh(now - DESK_MAX_AGE_MS + 1, now), true);
    assert.equal(isCacheFresh(now - DESK_MAX_AGE_MS - 1, now), false);
    assert.match(lastUpdatedBanner(now, "en"), /Last updated at/);
    assert.match(lastUpdatedBanner(now, "hi"), /आखिरी अपडेट/);
  });

  it("clears every cache name and the service worker uses the bumped version", async () => {
    const deleted: string[] = [];
    await clearOfflineCaches({
      keys: async () => ["saathi-pwa-v1", "saathi-pwa-v2"],
      delete: async (key) => {
        deleted.push(key);
        return true;
      },
    });
    assert.deepEqual(deleted, ["saathi-pwa-v1", "saathi-pwa-v2"]);
    const sw = readFileSync(path.join(process.cwd(), "public/sw.js"), "utf8");
    assert.match(sw, new RegExp(SW_VERSION));
    assert.match(sw, new RegExp(CLEAR_CACHE_MESSAGE));
    assert.match(sw, /cache\.put\(req, copy\)/);
    assert.doesNotMatch(sw, /saathi-pwa-v1/);
  });
});
