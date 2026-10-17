/**
 * One allowlisted Bolna call. Do not run a live dial unless Priyansh says go.
 *
 * Default: print the intended payload and exit without fetch.
 * A real POST /call needs MOCK_BOLNA=0, Bolna secrets, an allowlisted parent,
 * and SAATHI_CONFIRM_LIVE_CALL=1.
 */
async function main() {
  const live = process.env.SAATHI_CONFIRM_LIVE_CALL === "1" && process.env.MOCK_BOLNA === "0";
  if (!live) {
    console.log(
      JSON.stringify(
        {
          dry_run: true,
          reason: "SAATHI_CONFIRM_LIVE_CALL is not 1 or MOCK_BOLNA is on",
          post: "/call",
          omits: ["from_phone_number"],
          timestamps: "+05:30 only, never Z",
        },
        null,
        2,
      ),
    );
    return;
  }
  const { placeMorningCall } = await import("../../src/lib/bolna/place.ts");
  const { closeDb } = await import("../../src/lib/db/client.ts");
  const { ensureSeed } = await import("../../src/lib/db/seed.ts");
  await ensureSeed();
  const result = await placeMorningCall(process.env.SAATHI_TEST_PARENT_ID || "parent_kamla");
  console.log(JSON.stringify(result, null, 2));
  await closeDb();
  if (!result.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
