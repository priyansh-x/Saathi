import { readFileSync } from "node:fs";
import path from "node:path";

const agent = JSON.parse(
  readFileSync(path.join(process.cwd(), "scripts/bolna/agent.json"), "utf8"),
) as Record<string, unknown>;

const key = process.env.BOLNA_API_KEY;
const base = process.env.BOLNA_BASE_URL || "https://api.bolna.ai";

async function main() {
  if (!key) {
    console.log("Dry run. Set BOLNA_API_KEY to POST /v2/agent.");
    console.log(JSON.stringify({ expect: 201, agent_name: agent.agent_name, language: agent.language }, null, 2));
    return;
  }
  const res = await fetch(`${base}/v2/agent`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(agent),
  });
  const body = await res.text();
  console.log(res.status, body);
  if (res.status !== 201) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
