import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pgliteDataDir } from "./client";

describe("pgliteDataDir", () => {
  it("keeps a local disk path off Vercel", () => {
    assert.equal(pgliteDataDir({}), ".data/saathi");
  });

  it("uses /tmp on Vercel so the read-only lambda cwd cannot crash EXAMPLE", () => {
    assert.equal(pgliteDataDir({ VERCEL: "1" }), "/tmp/saathi-pglite");
  });

  it("honours PGLITE_PATH, including :memory:", () => {
    assert.equal(pgliteDataDir({ PGLITE_PATH: "/tmp/saathi", VERCEL: "1" }), "/tmp/saathi");
    assert.equal(pgliteDataDir({ PGLITE_PATH: ":memory:" }), null);
  });
});
