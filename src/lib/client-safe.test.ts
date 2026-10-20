import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clientSafe } from "@/lib/client-safe";

describe("clientSafe", () => {
  it("turns Date fields into IST stamps, not UTC Z", () => {
    const at = new Date("2026-10-20T03:00:00.000Z");
    const out = clientSafe({ id: "a1", created_at: at, late: true });
    assert.equal(typeof out.created_at, "string");
    assert.equal(out.created_at, "2026-10-20T08:30:00+05:30");
    assert.equal(out.late, true);
  });
});
