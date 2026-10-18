import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { publicBaseUrl } from "@/lib/config";
import { injectConsentLines } from "@/lib/voice/consent-line";

export const AGENT_SNAPSHOT_PATH = "scripts/bolna/agent.json";
export const SYSTEM_PROMPT_PATH = "docs/saathi/voice/system_prompt_bolna.md";
export const TOOLS_SCHEMA_PATH = "docs/saathi/voice/tools_schema.md";

export const TOOL_TOKEN_PLACEHOLDER = "Bearer ${BOLNA_TOOL_TOKEN}";
export const WEBHOOK_SECRET_PLACEHOLDER = "Bearer ${BOLNA_WEBHOOK_SECRET}";

const TOOL_PATHS: Record<string, string> = {
  log_medicine: "/api/tools/log_medicine",
  raise_alert: "/api/tools/raise_alert",
  relay_message_to_family: "/api/tools/relay_message_to_family",
  save_memory_note: "/api/tools/save_memory_note",
  record_consent: "/api/tools/record_consent",
};

export type JsonSchemaProperty = {
  type?: string;
  enum?: string[];
  description?: string;
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty;
};

export type CustomTaskTool = {
  name: string;
  description: string;
  pre_call_message?: string;
  parameters: {
    type: "object";
    properties: Record<string, JsonSchemaProperty>;
    required?: string[];
  };
  key: "custom_task";
  value: {
    method: string;
    url: string;
    api_token: string;
    headers?: Record<string, string>;
    param: Record<string, string>;
  };
};

export type BolnaAgentJson = {
  agent_name: string;
  agent_welcome_message: string;
  webhook_url: string;
  webhook_headers: { Authorization: string };
  call_summary_enabled: true;
  language: "hi";
  calling_guardrails: {
    timezone: "Asia/Kolkata";
    call_start_hour: number;
    call_end_hour: number;
  };
  pipelines: Array<Array<string>>;
  transcriber: { provider: "sarvam"; model: string; language: "hi" };
  llm: {
    provider: string;
    model: string;
    agent_type: "simple_llm_agent";
    agent_flow_type: "streaming";
  };
  synthesizer: {
    provider: "sarvam";
    model: string;
    provider_config: { language: "hi" };
  };
  tools: CustomTaskTool[];
  prompt: string;
};

export function extractSystemPrompt(md: string) {
  const begin = md.indexOf("## BEGIN PROMPT");
  const end = md.indexOf("## END PROMPT");
  if (begin < 0 || end < 0 || end <= begin) {
    throw new Error("system_prompt_bolna.md is missing BEGIN/END PROMPT markers");
  }
  return md.slice(begin + "## BEGIN PROMPT".length, end).trim();
}

function extractJsonBlocks(md: string): unknown[] {
  const blocks: unknown[] = [];
  const re = /```json\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(md))) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      /* skip extraction examples that are not standalone JSON */
    }
  }
  return blocks;
}

export function isCustomTaskTool(value: unknown): value is CustomTaskTool {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<CustomTaskTool>;
  return row.key === "custom_task" && typeof row.name === "string" && !!row.value && !!row.parameters;
}

export function assertFlatToolParams(tool: CustomTaskTool) {
  for (const [name, prop] of Object.entries(tool.parameters.properties || {})) {
    if (!prop || prop.type === "object" || prop.type === "array" || prop.properties || prop.items) {
      throw new Error(`nested tool param ${tool.name}.${name}`);
    }
  }
  for (const [name, value] of Object.entries(tool.value.param || {})) {
    if (typeof value !== "string") throw new Error(`nested tool param ${tool.name}.${name}`);
    if (!/^%\([^)]+\)[sif]$/.test(value)) {
      throw new Error(`param ${tool.name}.${name} must be a flat Python format specifier`);
    }
  }
}

function rewriteTool(tool: CustomTaskTool, base: string): CustomTaskTool {
  const suffix = TOOL_PATHS[tool.name];
  if (!suffix) throw new Error(`unknown tool ${tool.name}`);
  const param: Record<string, string> = { ...tool.value.param };
  if (!param.parent_id) param.parent_id = "%(parent_id)s";
  const next: CustomTaskTool = {
    name: tool.name,
    description: tool.description,
    pre_call_message: tool.pre_call_message ?? "",
    parameters: tool.parameters,
    key: "custom_task",
    value: {
      method: "POST",
      url: `${base}${suffix}`,
      api_token: TOOL_TOKEN_PLACEHOLDER,
      headers: { "Content-Type": "application/json" },
      param,
    },
  };
  assertFlatToolParams(next);
  return next;
}

function recordConsentTool(base: string): CustomTaskTool {
  return rewriteTool(
    {
      name: "record_consent",
      description:
        "Record whether the parent said yes, no, or later to daily morning calls. Flat params only. answer is yes, no, or later. later is hesitation, baad mein, or no clear answer. On any call, answer=no if they say stop or बंद करो.",
      pre_call_message: "",
      parameters: {
        type: "object",
        properties: {
          answer: { type: "string", enum: ["yes", "no", "later"] },
          parent_id: { type: "string" },
          call_sid: { type: "string" },
        },
        required: ["answer", "parent_id", "call_sid"],
      },
      key: "custom_task",
      value: {
        method: "POST",
        url: `${base}/api/tools/record_consent`,
        api_token: TOOL_TOKEN_PLACEHOLDER,
        headers: { "Content-Type": "application/json" },
        param: {
          answer: "%(answer)s",
          parent_id: "%(parent_id)s",
          call_sid: "%(call_sid)s",
          to_number: "%(to_number)s",
        },
      },
    },
    base,
  );
}

export function toolsFromSchema(md: string, base: string): CustomTaskTool[] {
  const fromDocs = extractJsonBlocks(md).filter(isCustomTaskTool).map((tool) => rewriteTool(tool, base));
  const names = new Set(fromDocs.map((tool) => tool.name));
  if (!names.has("record_consent")) fromDocs.push(recordConsentTool(base));
  return fromDocs;
}

export function prettyAgent(agent: BolnaAgentJson) {
  return `${JSON.stringify(agent, null, 2)}\n`;
}

export function buildBolnaAgent(root = process.cwd(), base = publicBaseUrl()): BolnaAgentJson {
  const promptMd = readFileSync(path.join(root, SYSTEM_PROMPT_PATH), "utf8");
  const toolsMd = readFileSync(path.join(root, TOOLS_SCHEMA_PATH), "utf8");
  const prompt = injectConsentLines(extractSystemPrompt(promptMd));
  const tools = toolsFromSchema(toolsMd, base);
  return {
    agent_name: "Saathi",
    agent_welcome_message: "Namaste {{address_term}}.",
    webhook_url: `${base}/api/webhooks/bolna`,
    webhook_headers: { Authorization: WEBHOOK_SECRET_PLACEHOLDER },
    call_summary_enabled: true,
    language: "hi",
    calling_guardrails: {
      timezone: "Asia/Kolkata",
      call_start_hour: 7,
      call_end_hour: 11,
    },
    pipelines: [["transcriber", "llm", "synthesizer"]],
    transcriber: { provider: "sarvam", model: "saaras:v4", language: "hi" },
    llm: {
      provider: "openai",
      model: "gpt-4.1-mini",
      agent_type: "simple_llm_agent",
      agent_flow_type: "streaming",
    },
    synthesizer: {
      provider: "sarvam",
      model: "bulbul:v4-flash",
      provider_config: { language: "hi" },
    },
    tools,
    prompt,
  };
}

export function loadAgentSnapshot(root = process.cwd()): BolnaAgentJson | null {
  const file = path.join(root, AGENT_SNAPSHOT_PATH);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")) as BolnaAgentJson;
}

export function parseSyncArgs(argv: string[]) {
  return { apply: argv.includes("--apply") };
}

export function canApplySync(env: Record<string, string | undefined> = process.env) {
  const key = (env.BOLNA_API_KEY || "").trim();
  const id = (env.BOLNA_AGENT_ID || "").trim();
  if (!key || !id) {
    return { ok: false as const, reason: "missing_bolna_key_or_agent_id" };
  }
  return { ok: true as const, agentId: id, apiKey: key };
}

export type SyncFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function runBolnaSync(
  argv: string[],
  opts: {
    fetchImpl?: SyncFetch;
    log?: (line: string) => void;
    env?: Record<string, string | undefined>;
    root?: string;
  } = {},
) {
  const log = opts.log ?? console.log;
  const env = opts.env ?? process.env;
  const { apply } = parseSyncArgs(argv);
  const agent = buildBolnaAgent(opts.root);
  const built = prettyAgent(agent);
  const snapshot = loadAgentSnapshot(opts.root);
  const snapText = snapshot ? prettyAgent(snapshot) : "";

  log(built.trimEnd());
  if (!snapshot) {
    log("No scripts/bolna/agent.json snapshot yet.");
  } else if (built === snapText) {
    log("Matches scripts/bolna/agent.json.");
  } else {
    log("Diff vs scripts/bolna/agent.json: built agent JSON differs from the committed snapshot.");
  }

  if (!apply) {
    log("Dry run. Pass --apply with BOLNA_API_KEY and BOLNA_AGENT_ID to PUT the existing agent. Never creates a new agent.");
    return { dryRun: true as const, applied: false as const, fetchCalls: [] as string[] };
  }

  const allowed = canApplySync(env);
  if (!allowed.ok) {
    log("Refusing --apply: need BOLNA_API_KEY and BOLNA_AGENT_ID. Will not POST /v2/agent.");
    return { dryRun: false as const, applied: false as const, fetchCalls: [] as string[], reason: allowed.reason };
  }

  const base = (env.BOLNA_BASE_URL || "https://api.bolna.ai").replace(/\/$/, "");
  const url = `${base}/v2/agent/${allowed.agentId}`;
  const fetchImpl = opts.fetchImpl ?? fetch;
  const res = await fetchImpl(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${allowed.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(agent),
  });
  const body = await res.text();
  log(`${res.status} PUT ${url}`);
  log(body);
  if (!res.ok) {
    throw new Error(`Bolna PUT failed: ${res.status}`);
  }
  return { dryRun: false as const, applied: true as const, fetchCalls: [`PUT ${url}`] };
}
