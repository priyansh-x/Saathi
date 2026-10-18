import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { canPlaceLiveCall } from "../bolna/test-call-cli";
import { placeMorningCall } from "../bolna/place";
import { getCallProvider } from "./provider";
import { assertLiveSecrets, callProviderName } from "../config";
import { closeDb } from "../db/client";
import { seed } from "../db/seed";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";
delete process.env.CALL_PROVIDER;

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("call provider seam", () => {
  it("defaults to simulated, and MOCK_BOLNA=1 is an alias", () => {
    delete process.env.CALL_PROVIDER;
    process.env.MOCK_BOLNA = "1";
    assert.equal(callProviderName(), "simulated");
    assert.equal(getCallProvider().name, "simulated");
  });

  it("treats MOCK_BOLNA=0 as a bolna alias when CALL_PROVIDER is unset", () => {
    const prev = process.env.MOCK_BOLNA;
    delete process.env.CALL_PROVIDER;
    process.env.MOCK_BOLNA = "0";
    try {
      assert.equal(callProviderName(), "bolna");
      assert.equal(getCallProvider().name, "bolna");
    } finally {
      process.env.MOCK_BOLNA = prev;
    }
  });

  it("lets an explicit CALL_PROVIDER=simulated win over MOCK_BOLNA=0", () => {
    const prev = { mock: process.env.MOCK_BOLNA, provider: process.env.CALL_PROVIDER };
    process.env.CALL_PROVIDER = "simulated";
    process.env.MOCK_BOLNA = "0";
    try {
      assert.equal(callProviderName(), "simulated");
    } finally {
      process.env.MOCK_BOLNA = prev.mock;
      if (prev.provider) process.env.CALL_PROVIDER = prev.provider;
      else delete process.env.CALL_PROVIDER;
    }
  });

  it("bolna still refuses without secrets and allowlist", async () => {
    const prev = {
      mock: process.env.MOCK_BOLNA,
      provider: process.env.CALL_PROVIDER,
      key: process.env.BOLNA_API_KEY,
      tool: process.env.SAATHI_TOOL_TOKEN,
      cron: process.env.CRON_SECRET,
      hook: process.env.BOLNA_WEBHOOK_SECRET,
      phones: process.env.ALLOWED_PHONE_NUMBERS,
    };
    process.env.CALL_PROVIDER = "bolna";
    process.env.MOCK_BOLNA = "0";
    delete process.env.BOLNA_API_KEY;
    delete process.env.SAATHI_TOOL_TOKEN;
    delete process.env.CRON_SECRET;
    delete process.env.BOLNA_WEBHOOK_SECRET;
    process.env.ALLOWED_PHONE_NUMBERS = "";
    const urls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    try {
      assert.throws(() => assertLiveSecrets(), /MOCK_BOLNA=0/);
      assert.equal(canPlaceLiveCall("+910000000000", true).ok, false);
      const placed = await placeMorningCall("parent_kamla");
      assert.equal(placed.ok, false);
      if (!placed.ok) assert.equal(placed.reason, "not_allowlisted");
      assert.equal(urls.length, 0);
    } finally {
      globalThis.fetch = original;
      process.env.MOCK_BOLNA = prev.mock;
      if (prev.provider) process.env.CALL_PROVIDER = prev.provider;
      else delete process.env.CALL_PROVIDER;
      if (prev.key) process.env.BOLNA_API_KEY = prev.key;
      else delete process.env.BOLNA_API_KEY;
      if (prev.tool) process.env.SAATHI_TOOL_TOKEN = prev.tool;
      else delete process.env.SAATHI_TOOL_TOKEN;
      if (prev.cron) process.env.CRON_SECRET = prev.cron;
      else delete process.env.CRON_SECRET;
      if (prev.hook) process.env.BOLNA_WEBHOOK_SECRET = prev.hook;
      else delete process.env.BOLNA_WEBHOOK_SECRET;
      if (prev.phones !== undefined) process.env.ALLOWED_PHONE_NUMBERS = prev.phones;
    }
  });
});
