import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TOOL_TOKEN_PLACEHOLDER,
  WEBHOOK_SECRET_PLACEHOLDER,
  assertFlatToolParams,
  buildBolnaAgent,
  canApplySync,
  loadAgentSnapshot,
  prettyAgent,
  runBolnaSync,
} from "./agent-config";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";

describe("bolna:sync agent JSON", () => {
  it("builds tools from the Voice schema with flat custom_task params", () => {
    const prev = process.env.PUBLIC_BASE_URL;
    process.env.PUBLIC_BASE_URL = "https://example.saathi.test";
    try {
      const agent = buildBolnaAgent();
      assert.equal(agent.webhook_url, "https://example.saathi.test/api/webhooks/bolna");
      assert.equal(agent.webhook_headers.Authorization, WEBHOOK_SECRET_PLACEHOLDER);
      assert.equal(agent.tools.length >= 5, true);
      const names = agent.tools.map((tool) => tool.name).sort();
      assert.deepEqual(names, [
        "log_medicine",
        "raise_alert",
        "record_consent",
        "relay_message_to_family",
        "save_memory_note",
      ]);
      for (const tool of agent.tools) {
        assert.equal(tool.key, "custom_task");
        assert.equal(tool.value.api_token, TOOL_TOKEN_PLACEHOLDER);
        assert.equal(tool.value.url.startsWith("https://example.saathi.test/api/tools/"), true);
        assert.equal(tool.value.url.includes(process.env.PUBLIC_BASE_URL || ""), true);
        assertFlatToolParams(tool);
      }
    } finally {
      if (prev) process.env.PUBLIC_BASE_URL = prev;
      else delete process.env.PUBLIC_BASE_URL;
    }
  });

  it("keeps the committed snapshot in sync with the builder", () => {
    const agent = buildBolnaAgent(process.cwd(), "http://127.0.0.1:43147");
    const snapshot = loadAgentSnapshot();
    assert.ok(snapshot);
    assert.equal(prettyAgent(snapshot!), prettyAgent(agent));
  });

  it("dry-run never fetches, even when Bolna secrets are set", async () => {
    const fetches: string[] = [];
    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      fetches.push(`${init?.method || "GET"} ${String(input)}`);
      return new Response("{}", { status: 200 });
    };
    const logs: string[] = [];
    const result = await runBolnaSync([], {
      fetchImpl,
      log: (line) => logs.push(line),
      env: { ...process.env, BOLNA_API_KEY: "example-key", BOLNA_AGENT_ID: "example-agent" },
    });
    assert.equal(result.dryRun, true);
    assert.equal(result.applied, false);
    assert.deepEqual(fetches, []);
    assert.match(logs.join("\n"), /Dry run/);
    assert.equal(canApplySync({ BOLNA_API_KEY: "", BOLNA_AGENT_ID: "" }).ok, false);
  });

  it("refuses --apply without an existing agent id and never POSTs create", async () => {
    const fetches: string[] = [];
    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      fetches.push(`${init?.method || "GET"} ${String(input)}`);
      return new Response("{}", { status: 201 });
    };
    const result = await runBolnaSync(["--apply"], {
      fetchImpl,
      log: () => undefined,
      env: { ...process.env, BOLNA_API_KEY: "example-key" },
    });
    assert.equal(result.applied, false);
    assert.equal(fetches.length, 0);
  });

  it("applies with PUT /v2/agent/{id} only", async () => {
    const fetches: { method: string; url: string }[] = [];
    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      fetches.push({ method: init?.method || "GET", url: String(input) });
      return new Response(JSON.stringify({ message: "success", state: "updated" }), { status: 200 });
    };
    const result = await runBolnaSync(["--apply"], {
      fetchImpl,
      log: () => undefined,
      env: {
        ...process.env,
        BOLNA_API_KEY: "example-key",
        BOLNA_AGENT_ID: "agent-existing",
        BOLNA_BASE_URL: "https://api.bolna.ai",
      },
    });
    assert.equal(result.applied, true);
    assert.deepEqual(fetches, [{ method: "PUT", url: "https://api.bolna.ai/v2/agent/agent-existing" }]);
    assert.equal(fetches.some((row) => row.method === "POST"), false);
  });
});
