/**
 * Build the Bolna agent JSON from the repo and optionally PUT the existing agent.
 *
 * Default (no --apply): print the JSON and a diff against scripts/bolna/agent.json. Never fetches.
 * Apply: npm run bolna:sync -- --apply
 *   Requires BOLNA_API_KEY, BOLNA_AGENT_ID, BOLNA_TOOL_TOKEN, and a public https PUBLIC_BASE_URL.
 *   PUT /v2/agent/{id} only — never creates an agent. Secrets are filled in memory, never printed.
 */
import { runBolnaSync } from "../../src/lib/bolna/agent-config";

async function main() {
  const result = await runBolnaSync(process.argv.slice(2));
  if ("reason" in result && result.reason) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
