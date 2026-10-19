import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { canViewOps } from "@/lib/ops/access";

describe("/brand gate", () => {
  it("404s unless the signed-in email is on OPS_EMAILS", () => {
    const prev = process.env.OPS_EMAILS;
    process.env.OPS_EMAILS = "priyansh@example.com";
    try {
      assert.equal(canViewOps(undefined), false);
      assert.equal(canViewOps("visitor@example.com"), false);
      assert.equal(canViewOps("priyansh@example.com"), true);
      process.env.OPS_EMAILS = "";
      assert.equal(canViewOps("priyansh@example.com"), false);
    } finally {
      process.env.OPS_EMAILS = prev;
    }
  });

  it("the page calls notFound when ops is closed", () => {
    const src = readFileSync(path.join(process.cwd(), "src/app/brand/page.tsx"), "utf8");
    assert.match(src, /canViewOps/);
    assert.match(src, /notFound/);
  });
});
