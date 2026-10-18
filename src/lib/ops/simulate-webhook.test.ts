import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleBolnaWebhookPost } from "@/app/api/webhooks/bolna/route";

const HOOK = "simulate-hook-secret-32chars-minx";
const TOOL = "simulate-tool-token-32chars-minx";

function withEnv(vars: Record<string, string | undefined>, fn: () => Promise<void>) {
  const prev: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) {
    prev[key] = process.env[key];
    if (vars[key] === undefined) delete process.env[key];
    else process.env[key] = vars[key];
  }
  return fn().finally(() => {
    for (const key of Object.keys(prev)) {
      if (prev[key] === undefined) delete process.env[key];
      else process.env[key] = prev[key]!;
    }
  });
}

function req(secret: string) {
  return new Request("http://local/api/webhooks/bolna", {
    method: "POST",
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: JSON.stringify({
      id: `sim_route_${Date.now()}`,
      execution_id: `sim_route_${Date.now()}`,
      status: "completed",
      conversation_duration: 80,
      transcript: "assistant: Namaste\nuser: Theek thi.",
      context_details: { recipient_data: { parent_id: "parent_kamla" } },
    }),
  });
}

describe("simulate webhook on mocked hosted deploy", () => {
  it("accepts the webhook secret on the real route handler in mock production", async () => {
    await withEnv(
      {
        NODE_ENV: "production",
        MOCK_BOLNA: "1",
        CALL_PROVIDER: "simulated",
        BOLNA_WEBHOOK_SECRET: HOOK,
        BOLNA_TOOL_TOKEN: TOOL,
      },
      async () => {
        const ok = await handleBolnaWebhookPost(req(HOOK));
        assert.equal(ok.status, 200);
        const denied = await handleBolnaWebhookPost(req(TOOL));
        assert.equal(denied.status, 401);
      },
    );
  });
});
