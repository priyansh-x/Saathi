import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { APP_ID, APP_NAME, EMULATOR_DEV_URL } from "./brand";
import { buildCapacitorConfig, resolveServerUrl } from "./capacitor-config";

describe("Capacitor server URL", () => {
  it("refuses http and localhost unless --dev", () => {
    assert.throws(() => resolveServerUrl({ SAATHI_APP_URL: "http://example.com" }, { dev: false }), /https/i);
    assert.throws(() => resolveServerUrl({ SAATHI_APP_URL: "https://localhost:43147" }, { dev: false }), /localhost/i);
    assert.throws(() => resolveServerUrl({ SAATHI_APP_URL: "https://127.0.0.1" }, { dev: false }), /localhost/i);
    assert.throws(() => resolveServerUrl({}, { dev: false }), /SAATHI_APP_URL/);
  });

  it("allows the emulator loopback only with --dev", () => {
    assert.equal(resolveServerUrl({}, { dev: true }), EMULATOR_DEV_URL);
    assert.equal(resolveServerUrl({ SAATHI_APP_URL: EMULATOR_DEV_URL }, { dev: true }), EMULATOR_DEV_URL);
    assert.throws(() => resolveServerUrl({ SAATHI_APP_URL: "http://example.com" }, { dev: true }), /10\.0\.2\.2/);
  });

  it("keeps https host-only allowNavigation and uses brand appId", () => {
    const cfg = buildCapacitorConfig({ SAATHI_APP_URL: "https://family.saathi.app/" }, { dev: false });
    assert.equal(cfg.appId, APP_ID);
    assert.equal(cfg.appName, APP_NAME);
    assert.equal(cfg.server?.url, "https://family.saathi.app");
    assert.deepEqual(cfg.server?.allowNavigation, ["family.saathi.app"]);
    assert.match(APP_ID, /app\.saathi\.family/);
  });
});

describe("in-app URL policy", () => {
  it("keeps the hosted host inside, and sends tel/wa/mail/other hosts out", async () => {
    const { classifyAppUrl } = await import("./url-policy");
    assert.equal(classifyAppUrl("https://family.saathi.app/d/example-kamla", "family.saathi.app"), "in-app");
    assert.equal(classifyAppUrl("tel:112", "family.saathi.app"), "dialer");
    assert.equal(classifyAppUrl("mailto:hello@example.com", "family.saathi.app"), "external");
    assert.equal(classifyAppUrl("https://wa.me/910000000000", "family.saathi.app"), "external");
    assert.equal(classifyAppUrl("https://other.example/x", "family.saathi.app"), "external");
    const { isTodayPath } = await import("./url-policy");
    assert.equal(isTodayPath("/d/example-kamla"), true);
    assert.equal(isTodayPath("/d/example-kamla/alerts"), false);
  });
});
