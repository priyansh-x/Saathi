import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TOOL_PRE_CALL_MESSAGE,
  TOOL_TOKEN_PLACEHOLDER,
  assertFlatToolParams,
  buildBolnaAgent,
  canApplySync,
  lineByLineDiff,
  loadAgentSnapshot,
  materializeAgentSecrets,
  prettyAgent,
  runBolnaSync,
} from "./agent-config";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";

function toolsParams(agent: ReturnType<typeof buildBolnaAgent>) {
  return agent.agent_config.tasks[0]!.tools_config.api_tools.tools_params;
}

function toolDefs(agent: ReturnType<typeof buildBolnaAgent>) {
  return agent.agent_config.tasks[0]!.tools_config.api_tools.tools;
}

describe("bolna:sync agent JSON", () => {
  it("builds a v2 agent with flat api_tools and no webhook_headers", () => {
    const prev = process.env.PUBLIC_BASE_URL;
    process.env.PUBLIC_BASE_URL = "https://example.saathi.test";
    try {
      const agent = buildBolnaAgent();
      assert.equal(agent.agent_config.webhook_url, "https://example.saathi.test/api/webhooks/bolna");
      assert.equal("webhook_headers" in agent.agent_config, false);
      assert.equal("webhook_headers" in agent, false);
      const names = toolDefs(agent).map((tool) => tool.name).sort();
      assert.deepEqual(names, [
        "family_message_played",
        "log_medicine",
        "raise_alert",
        "record_consent",
        "relay_message_to_family",
        "request_refill",
        "save_family_reply",
        "save_memory_note",
      ]);
      const params = toolsParams(agent);
      const spoken = new Set([
        "log_medicine",
        "raise_alert",
        "relay_message_to_family",
        "save_memory_note",
        "record_consent",
      ]);
      for (const tool of toolDefs(agent)) {
        const value = params[tool.name];
        assert.ok(value);
        assert.equal(
          tool.pre_call_message,
          spoken.has(tool.name) ? TOOL_PRE_CALL_MESSAGE : "",
        );
        assert.equal(tool.pre_call_message.includes("Just give me a moment"), false);
        assert.equal(value.api_token, TOOL_TOKEN_PLACEHOLDER);
        assert.equal(value.url.startsWith("https://example.saathi.test/api/tools/"), true);
        assertFlatToolParams({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
          key: "custom_task",
          value: { method: value.method, url: value.url, api_token: value.api_token, param: value.param },
        });
      }
      assert.match(agent.agent_prompts.task_1.system_prompt, /Saathi/);
      assert.equal(agent.agent_config.tasks[0]!.toolchain.pipelines[0]!.join(","), "transcriber,llm,synthesizer");
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

  it("prints a line-by-line diff against the snapshot", () => {
    const diff = lineByLineDiff("a\nb\n", "a\nc\n");
    assert.deepEqual(diff, ["- c", "+ b"]);
  });

  it("dry-run never fetches, keeps ${...} placeholders, and never prints secrets", async () => {
    const fetches: string[] = [];
    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      fetches.push(`${init?.method || "GET"} ${String(input)}`);
      return new Response("{}", { status: 200 });
    };
    const logs: string[] = [];
    const result = await runBolnaSync([], {
      fetchImpl,
      log: (line) => logs.push(line),
      env: {
        ...process.env,
        BOLNA_API_KEY: "example-key",
        BOLNA_AGENT_ID: "example-agent",
        BOLNA_TOOL_TOKEN: "super-secret-tool-token",
        BOLNA_WEBHOOK_SECRET: "super-secret-webhook",
      },
    });
    assert.equal(result.dryRun, true);
    assert.equal(result.applied, false);
    assert.deepEqual(fetches, []);
    const blob = logs.join("\n");
    assert.match(blob, /Dry run/);
    assert.match(blob, /\$\{BOLNA_TOOL_TOKEN\}/);
    assert.equal(blob.includes("super-secret-tool-token"), false);
    assert.equal(blob.includes("super-secret-webhook"), false);
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
      env: {
        ...process.env,
        BOLNA_API_KEY: "example-key",
        PUBLIC_BASE_URL: "https://saathi.example.test",
        BOLNA_TOOL_TOKEN: "example-tool-token-value-not-for-disk",
      },
    });
    assert.equal(result.applied, false);
    assert.equal(fetches.length, 0);
  });

  it("refuses --apply unless PUBLIC_BASE_URL is public https", async () => {
    const fetches: string[] = [];
    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      fetches.push(`${init?.method || "GET"} ${String(input)}`);
      return new Response("{}", { status: 200 });
    };
    const envBase = {
      BOLNA_API_KEY: "example-key",
      BOLNA_AGENT_ID: "agent-existing",
      BOLNA_TOOL_TOKEN: "example-tool-token-value-not-for-disk",
    };
    for (const PUBLIC_BASE_URL of ["", "http://saathi.example.test", "https://localhost", "https://127.0.0.1"]) {
      const result = await runBolnaSync(["--apply"], {
        fetchImpl,
        log: () => undefined,
        env: { ...process.env, ...envBase, PUBLIC_BASE_URL },
      });
      assert.equal(result.applied, false, PUBLIC_BASE_URL);
      assert.equal(fetches.length, 0, PUBLIC_BASE_URL);
    }
    assert.equal(canApplySync({ ...envBase, PUBLIC_BASE_URL: "https://saathi.example.test" }).ok, true);
  });

  it("applies with PUT /v2/agent/{id} and materializes secrets only in memory", async () => {
    const fetches: { method: string; url: string; body: string }[] = [];
    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      fetches.push({ method: init?.method || "GET", url: String(input), body: String(init?.body) });
      return new Response(JSON.stringify({ message: "success", state: "updated" }), { status: 200 });
    };
    const logs: string[] = [];
    const token = "example-tool-token-value-not-for-disk";
    const result = await runBolnaSync(["--apply"], {
      fetchImpl,
      log: (line) => logs.push(line),
      env: {
        ...process.env,
        BOLNA_API_KEY: "example-key",
        BOLNA_AGENT_ID: "agent-existing",
        BOLNA_BASE_URL: "https://api.bolna.ai",
        BOLNA_TOOL_TOKEN: token,
        PUBLIC_BASE_URL: "https://saathi.example.test",
      },
    });
    assert.equal(result.applied, true);
    assert.deepEqual(
      fetches.map((row) => ({ method: row.method, url: row.url })),
      [{ method: "PUT", url: "https://api.bolna.ai/v2/agent/agent-existing" }],
    );
    assert.equal(fetches.some((row) => row.method === "POST"), false);
    const sent = JSON.parse(fetches[0]!.body) as ReturnType<typeof buildBolnaAgent>;
    assert.equal(sent.agent_config.webhook_url, "https://saathi.example.test/api/webhooks/bolna");
    assert.equal("webhook_headers" in sent.agent_config, false);
    assert.equal(toolsParams(sent).log_medicine!.api_token, `Bearer ${token}`);
    assert.equal(JSON.stringify(sent).includes("${"), false);
    const blob = logs.join("\n");
    assert.equal(blob.includes(token), false);
    assert.match(blob, /\$\{BOLNA_TOOL_TOKEN\}/);
    const disk = prettyAgent(buildBolnaAgent(process.cwd(), "https://saathi.example.test"));
    assert.match(disk, /\$\{BOLNA_TOOL_TOKEN\}/);
    assert.equal(disk.includes(token), false);
    const live = materializeAgentSecrets(buildBolnaAgent(process.cwd(), "https://saathi.example.test"), {
      BOLNA_TOOL_TOKEN: token,
    });
    assert.equal(toolsParams(live).log_medicine!.api_token, `Bearer ${token}`);
  });
});
