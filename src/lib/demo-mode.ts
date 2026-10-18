import { runMockScenario } from "@/lib/bolna/mock-run";
import { EXAMPLE_TOKEN, callProviderName } from "@/lib/config";
import { query } from "@/lib/db/client";
import { insertExampleHousehold } from "@/lib/db/seed";
import { deleteFamily } from "@/lib/delete-family";

export function demoModeAllowed() {
  return callProviderName() === "simulated";
}

/** Wipe EXAMPLE rows only, then put Kamla back. Other families stay. */
export async function resetDemoHousehold() {
  const demos = await query<{ id: string }>(`select id from parents where is_example = true`);
  for (const row of demos) {
    await deleteFamily(row.id);
  }
  const exists = await query<{ id: string }>(`select id from parents where id = $1`, ["parent_kamla"]);
  if (!exists[0]) await insertExampleHousehold();
}

export async function playDemoGoodMorning() {
  await resetDemoHousehold();
  return runMockScenario("good", "parent_kamla");
}

export async function playDemoMissed() {
  return runMockScenario("missed", "parent_kamla");
}

export { EXAMPLE_TOKEN };
