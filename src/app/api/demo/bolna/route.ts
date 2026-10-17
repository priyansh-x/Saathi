import { connection } from "next/server";
import { isMockBolna } from "@/lib/config";
import { runMockScenario, type MockScenario } from "@/lib/bolna/mock-run";
import { ensureSeed } from "@/lib/db/seed";
import { readJson } from "@/lib/http";

export async function POST(req: Request) {
  await connection();
  if (!isMockBolna()) {
    return Response.json({ ok: false, error: "mock_disabled" }, { status: 403 });
  }
  await ensureSeed();
  const body = await readJson<{ scenario?: MockScenario; parent_id?: string }>(req);
  const scenario = body?.scenario ?? "good";
  return Response.json(await runMockScenario(scenario, body?.parent_id ?? "parent_kamla"));
}
