/**
 * One allowlisted Bolna call. Do not run a live dial unless Priyansh says go.
 *
 * Usage: npx tsx scripts/bolna/test-call.ts +91XXXXXXXXXX --yes
 * Default (no --yes, or MOCK_BOLNA still on): print the intended payload and exit without fetch.
 */
import { canPlaceLiveCall, parseTestCallArgs, plannedTestCall } from "../../src/lib/bolna/test-call-cli";

async function main() {
  const { yes, phone } = parseTestCallArgs(process.argv.slice(2));
  const live = canPlaceLiveCall(phone, yes);
  if (!live.ok) {
    const plan = plannedTestCall(phone || "+91");
    console.log(
      JSON.stringify(
        {
          dry_run: true,
          reason: live.reason,
          phone: phone || null,
          yes,
          post: plan.post,
          to: plan.to,
          allowlisted: plan.allowlisted,
          omits: plan.omits,
          timestamps: plan.timestamps,
        },
        null,
        2,
      ),
    );
    return;
  }

  const { query } = await import("../../src/lib/db/client");
  const { closeDb } = await import("../../src/lib/db/client");
  const { ensureSeed } = await import("../../src/lib/db/seed");
  const { placeMorningCall } = await import("../../src/lib/bolna/place");
  await ensureSeed();
  const parents = await query<{ id: string }>(`select id from parents where regexp_replace(phone, '[^0-9+]', '', 'g') = $1`, [
    live.to,
  ]);
  const parentId = parents[0]?.id;
  if (!parentId) {
    console.error(JSON.stringify({ ok: false, reason: "no_parent_for_number", to: live.to }));
    await closeDb();
    process.exit(1);
  }
  const result = await placeMorningCall(parentId);
  console.log(JSON.stringify(result, null, 2));
  await closeDb();
  if (!result.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
