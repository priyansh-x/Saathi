import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  adminEnabled,
  canOpenAdmin,
  encodeAdminCookie,
  passwordsMatch,
  safeAdminNext,
  verifyAdminCookie,
} from "./auth";

describe("admin auth", () => {
  it("issues a cookie that verifies until expiry", () => {
    const now = Date.parse("2026-10-22T08:40:00+05:30");
    const token = encodeAdminCookie(now);
    assert.equal(verifyAdminCookie(token, now), true);
    assert.equal(verifyAdminCookie(token, now + 60 * 60 * 11 * 1000), true);
    assert.equal(verifyAdminCookie(token, now + 60 * 60 * 13 * 1000), false);
    assert.equal(verifyAdminCookie("nope", now), false);
    assert.equal(verifyAdminCookie(`${token}x`, now), false);
  });

  it("matches passwords with a length mismatch still returning false", () => {
    assert.equal(passwordsMatch("secret", "secret"), true);
    assert.equal(passwordsMatch("secret", "other"), false);
    assert.equal(passwordsMatch("short", "longer-secret"), false);
    assert.equal(passwordsMatch("anything", ""), false);
  });

  it("opens via password cookie or ops email, and stays off when neither is configured", () => {
    const prevPass = process.env.ADMIN_PASSWORD;
    const prevOps = process.env.OPS_EMAILS;
    try {
      process.env.ADMIN_PASSWORD = "";
      process.env.OPS_EMAILS = "";
      assert.equal(adminEnabled(), false);
      assert.equal(canOpenAdmin({ cookie: null, email: "ops@example.com" }).ok, false);

      process.env.OPS_EMAILS = "ops@example.com";
      assert.equal(adminEnabled(), true);
      assert.equal(canOpenAdmin({ cookie: null, email: "ops@example.com" }).via, "ops");
      assert.equal(canOpenAdmin({ cookie: null, email: "visitor@example.com" }).ok, false);

      process.env.ADMIN_PASSWORD = "desk-pass";
      const token = encodeAdminCookie();
      assert.equal(canOpenAdmin({ cookie: token, email: null }).via, "password");
    } finally {
      process.env.ADMIN_PASSWORD = prevPass;
      process.env.OPS_EMAILS = prevOps;
    }
  });

  it("only allows /admin-relative next paths", () => {
    assert.equal(safeAdminNext("/admin"), "/admin");
    assert.equal(safeAdminNext("/admin/parent_kamla"), "/admin/parent_kamla");
    assert.equal(safeAdminNext("/admin?err=1"), "/admin?err=1");
    assert.equal(safeAdminNext("https://evil.example/admin"), "/admin");
    assert.equal(safeAdminNext("//evil.example"), "/admin");
    assert.equal(safeAdminNext("/ops"), "/admin");
    assert.equal(safeAdminNext(""), "/admin");
  });
});
