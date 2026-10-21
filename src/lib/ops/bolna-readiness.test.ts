import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";
import { processBolnaWebhook } from "@/lib/bolna/webhook";
import {
  bolnaEnvChecks,
  lastBolnaWebhook,
  loadBolnaReadiness,
  loadSyntheticCompletedFixture,
  postSimulateBolnaWebhook,
} from "./bolna-readiness";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("Bolna readiness", () => {
  it("never includes secret values or full phones", async () => {
    const prev = {
      key: process.env.BOLNA_API_KEY,
      agent: process.env.BOLNA_AGENT_ID,
      tool: process.env.BOLNA_TOOL_TOKEN,
      alias: process.env.SAATHI_TOOL_TOKEN,
      hook: process.env.BOLNA_WEBHOOK_SECRET,
      phones: process.env.ALLOWED_PHONE_NUMBERS,
      base: process.env.PUBLIC_BASE_URL,
    };
    process.env.BOLNA_API_KEY = "super-secret-key-do-not-leak";
    process.env.BOLNA_AGENT_ID = "agent-secret-id";
    process.env.BOLNA_TOOL_TOKEN = "tool-secret-do-not-leak";
    process.env.BOLNA_WEBHOOK_SECRET = "hook-secret-do-not-leak";
    process.env.ALLOWED_PHONE_NUMBERS = "+910000000008";
    process.env.PUBLIC_BASE_URL = "https://saathi.example.test";
    try {
      const snap = await loadBolnaReadiness({
        fetchImpl: async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
      });
      const blob = JSON.stringify(snap);
      assert.doesNotMatch(blob, /super-secret-key-do-not-leak/);
      assert.doesNotMatch(blob, /agent-secret-id/);
      assert.doesNotMatch(blob, /tool-secret-do-not-leak/);
      assert.doesNotMatch(blob, /hook-secret-do-not-leak/);
      assert.doesNotMatch(blob, /\+910000000008/);
      assert.match(blob, /••••0008/);
      const https = snap.checks.find((c) => c.id === "public_base");
      assert.equal(https?.ok, true);
      const allow = snap.checks.find((c) => c.id === "allowlist");
      assert.equal(allow?.ok, true);
      assert.equal(snap.checks.find((c) => c.id === "tool_token")?.ok, true);
      assert.equal(snap.checks.find((c) => c.id === "reachable")?.ok, true);
      assert.equal(snap.checks.find((c) => c.id === "reachable")?.detail, "https /api/health ok");
    } finally {
      if (prev.key) process.env.BOLNA_API_KEY = prev.key;
      else delete process.env.BOLNA_API_KEY;
      if (prev.agent) process.env.BOLNA_AGENT_ID = prev.agent;
      else delete process.env.BOLNA_AGENT_ID;
      if (prev.tool) process.env.BOLNA_TOOL_TOKEN = prev.tool;
      else delete process.env.BOLNA_TOOL_TOKEN;
      if (prev.alias) process.env.SAATHI_TOOL_TOKEN = prev.alias;
      else delete process.env.SAATHI_TOOL_TOKEN;
      if (prev.hook) process.env.BOLNA_WEBHOOK_SECRET = prev.hook;
      else delete process.env.BOLNA_WEBHOOK_SECRET;
      if (prev.phones) process.env.ALLOWED_PHONE_NUMBERS = prev.phones;
      else delete process.env.ALLOWED_PHONE_NUMBERS;
      if (prev.base) process.env.PUBLIC_BASE_URL = prev.base;
      else delete process.env.PUBLIC_BASE_URL;
    }
  });

  it("is red when HTTPS or allowlist count is wrong", () => {
    const prev = {
      phones: process.env.ALLOWED_PHONE_NUMBERS,
      base: process.env.PUBLIC_BASE_URL,
      token: process.env.BOLNA_TOOL_TOKEN,
      alias: process.env.SAATHI_TOOL_TOKEN,
    };
    process.env.ALLOWED_PHONE_NUMBERS = "";
    process.env.PUBLIC_BASE_URL = "http://127.0.0.1:43147";
    delete process.env.BOLNA_TOOL_TOKEN;
    process.env.SAATHI_TOOL_TOKEN = "only-alias";
    try {
      const checks = bolnaEnvChecks();
      assert.equal(checks.find((c) => c.id === "public_base")?.ok, false);
      assert.equal(checks.find((c) => c.id === "allowlist")?.ok, true);
      assert.equal(checks.find((c) => c.id === "allowlist")?.detail.includes("+91"), false);
      assert.equal(checks.find((c) => c.id === "tool_token")?.ok, false);
      assert.equal(checks.find((c) => c.id === "tool_token")?.label, "BOLNA_TOOL_TOKEN");
    } finally {
      if (prev.phones) process.env.ALLOWED_PHONE_NUMBERS = prev.phones;
      else delete process.env.ALLOWED_PHONE_NUMBERS;
      if (prev.base) process.env.PUBLIC_BASE_URL = prev.base;
      else delete process.env.PUBLIC_BASE_URL;
      if (prev.token) process.env.BOLNA_TOOL_TOKEN = prev.token;
      else delete process.env.BOLNA_TOOL_TOKEN;
      if (prev.alias) process.env.SAATHI_TOOL_TOKEN = prev.alias;
      else delete process.env.SAATHI_TOOL_TOKEN;
    }
  });

  it("reachable is only our own /api/health over HTTPS", async () => {
    const prev = process.env.PUBLIC_BASE_URL;
    const urls: string[] = [];
    process.env.PUBLIC_BASE_URL = "https://saathi.example.test";
    try {
      const snap = await loadBolnaReadiness({
        fetchImpl: async (input) => {
          urls.push(String(input));
          return new Response("{}", { status: 200 });
        },
      });
      assert.deepEqual(urls, ["https://saathi.example.test/api/health"]);
      assert.equal(snap.checks.find((c) => c.id === "reachable")?.ok, true);
    } finally {
      if (prev) process.env.PUBLIC_BASE_URL = prev;
      else delete process.env.PUBLIC_BASE_URL;
    }
    process.env.PUBLIC_BASE_URL = "http://127.0.0.1:43147";
    try {
      const snap = await loadBolnaReadiness({
        fetchImpl: async () => {
          throw new Error("should not fetch http");
        },
      });
      assert.equal(snap.checks.find((c) => c.id === "reachable")?.ok, false);
    } finally {
      if (prev) process.env.PUBLIC_BASE_URL = prev;
      else delete process.env.PUBLIC_BASE_URL;
    }
  });

  it("reports last webhook time and status only", async () => {
    const sid = `ops_wh_${Date.now()}`;
    await processBolnaWebhook(
      {
        status: "ringing",
        context_details: { recipient_data: { parent_id: "parent_kamla" } },
      },
      sid,
    );
    const snap = await loadBolnaReadiness();
    assert.equal(snap.lastWebhook?.status, "ringing");
    assert.match(snap.lastWebhook?.at ?? "", /\+05:30$/);
    const blob = JSON.stringify(snap.lastWebhook);
    assert.doesNotMatch(blob, /parent_kamla/);
    assert.doesNotMatch(blob, /transcript/i);
  });

  it("does not count a simulated fixture as the last Bolna webhook", async () => {
    const fixture = loadSyntheticCompletedFixture();
    await processBolnaWebhook(
      {
        ...fixture,
        status: "completed",
        context_details: { recipient_data: { parent_id: "parent_kamla" } },
      },
      `sim_ignore_${Date.now()}`,
    );
    const after = await lastBolnaWebhook();
    assert.notEqual(after?.status, "completed");
  });

  it("simulate posts the synthetic fixture with a Bearer secret and never returns it", async () => {
    process.env.BOLNA_WEBHOOK_SECRET = process.env.BOLNA_WEBHOOK_SECRET || "dev-hook";
    const secret = process.env.BOLNA_WEBHOOK_SECRET;
    const headers: string[] = [];
    const result = await postSimulateBolnaWebhook(async (input, init) => {
      assert.match(String(input), /\/api\/webhooks\/bolna$/);
      headers.push(String(init?.headers && "Authorization" in (init.headers as Record<string, string>)
        ? (init.headers as Record<string, string>).Authorization
        : ""));
      const body = JSON.parse(String(init?.body)) as { saathi_fixture?: string };
      assert.equal(body.saathi_fixture, "synthetic");
      return new Response("{}", { status: 200 });
    });
    assert.equal(result.ok, true);
    assert.equal(JSON.stringify(result).includes(secret), false);
    assert.equal(headers[0], `Bearer ${secret}`);
    assert.equal((loadSyntheticCompletedFixture() as { saathi_fixture?: string }).saathi_fixture, "synthetic");
  });
});
