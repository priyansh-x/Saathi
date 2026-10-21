import { readFileSync } from "node:fs";
import path from "node:path";
import { allowedPhones, bolnaWebhookSecret, callProviderName, publicBaseUrl, toolToken } from "@/lib/config";
import { query } from "@/lib/db/client";
import { maskPhone } from "@/lib/ops/mask";
import type { BolnaWebhook } from "@/lib/bolna/webhook";

export type ReadinessCheck = { id: string; label: string; ok: boolean; detail: string };

export type BolnaReadiness = {
  checks: ReadinessCheck[];
  allGreen: boolean;
  lastWebhook: { at: string; status: string } | null;
  allowlistMasked: string | null;
};

function set(value: string | undefined) {
  return Boolean(value && value.trim());
}

export function bolnaEnvChecks(): ReadinessCheck[] {
  const base = publicBaseUrl();
  const phones = allowedPhones();
  const allowOk = phones.length >= 1;
  return [
    {
      id: "call_provider",
      label: "CALL_PROVIDER",
      ok: true,
      detail: callProviderName(),
    },
    {
      id: "agent_id",
      label: "Agent id set",
      ok: set(process.env.BOLNA_AGENT_ID),
      detail: set(process.env.BOLNA_AGENT_ID) ? "set" : "missing",
    },
    {
      id: "api_key",
      label: "API key set",
      ok: set(process.env.BOLNA_API_KEY),
      detail: set(process.env.BOLNA_API_KEY) ? "set" : "missing",
    },
    {
      id: "tool_token",
      label: "BOLNA_TOOL_TOKEN",
      ok: set(process.env.BOLNA_TOOL_TOKEN),
      detail: set(process.env.BOLNA_TOOL_TOKEN) ? "set" : "missing",
    },
    {
      id: "webhook_secret",
      label: "Webhook secret set",
      ok: set(process.env.BOLNA_WEBHOOK_SECRET),
      detail: set(process.env.BOLNA_WEBHOOK_SECRET) ? "set" : "missing",
    },
    {
      id: "public_base",
      label: "PUBLIC_BASE_URL is HTTPS",
      ok: base.startsWith("https://"),
      detail: base.startsWith("https://") ? "https" : "not https",
    },
    {
      id: "allowlist",
      label: "Allowlist has at least one number",
      ok: allowOk,
      detail: allowOk ? phones.map((row) => maskPhone(row)).join(", ") : "empty",
    },
  ];
}

export async function lastBolnaWebhook(): Promise<{ at: string; status: string } | null> {
  const rows = await query<{ at: string; payload: string }>(
    `select at, payload from webhook_events
     where source = 'bolna'
       and payload not like '%"saathi_fixture"%'
     order by at desc, id desc
     limit 1`,
  );
  const row = rows[0];
  if (!row) return null;
  let status = "unknown";
  try {
    const body = JSON.parse(row.payload) as BolnaWebhook;
    status = (body.status || "unknown").toString();
  } catch {
    status = "unknown";
  }
  return { at: row.at, status };
}

export type SyncFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function probeOwnHealth(fetchImpl: SyncFetch = fetch) {
  const base = publicBaseUrl();
  if (!base.startsWith("https://")) {
    return { ok: false, detail: "not https" };
  }
  try {
    const res = await fetchImpl(`${base}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(4000),
    });
    return { ok: res.ok, detail: res.ok ? "https /api/health ok" : `health ${res.status}` };
  } catch {
    return { ok: false, detail: "https /api/health unreachable" };
  }
}

export async function loadBolnaReadiness(opts: { fetchImpl?: SyncFetch } = {}): Promise<BolnaReadiness> {
  const checks = bolnaEnvChecks();
  const health = await probeOwnHealth(opts.fetchImpl ?? fetch);
  checks.push({
    id: "reachable",
    label: "Reachable",
    ok: health.ok,
    detail: health.detail,
  });
  const lastWebhook = await lastBolnaWebhook();
  checks.push({
    id: "last_webhook",
    label: "Last Bolna webhook",
    ok: Boolean(lastWebhook),
    detail: lastWebhook ? `${lastWebhook.status} · ${lastWebhook.at}` : "none yet",
  });
  const phones = allowedPhones();
  return {
    checks,
    allGreen: checks.filter((c) => c.id !== "call_provider").every((c) => c.ok),
    lastWebhook,
    allowlistMasked: phones.length ? phones.map((row) => maskPhone(row)).join(", ") : null,
  };
}

export function loadSyntheticCompletedFixture(root = process.cwd()): BolnaWebhook {
  const file = path.join(root, "fixtures/bolna/synthetic_completed.json");
  return JSON.parse(readFileSync(file, "utf8")) as BolnaWebhook;
}

/** POST the synthetic fixture to our own webhook using the configured secret. Never returns the secret. */
export async function postSimulateBolnaWebhook(fetchImpl: SyncFetch = fetch) {
  const secret =
    bolnaWebhookSecret() || (process.env.NODE_ENV !== "production" ? toolToken() : "");
  if (!secret) return { ok: false as const, reason: "missing_webhook_secret" };
  const body = loadSyntheticCompletedFixture();
  const executionId = `sim_${Date.now()}`;
  const payload = { ...body, id: executionId, execution_id: executionId };
  const url = `${publicBaseUrl()}/api/webhooks/bolna`;
  const res = await fetchImpl(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok as boolean, status: res.status, execution_id: executionId };
}
