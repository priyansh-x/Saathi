import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "../db/client";
import { seed } from "../db/seed";
import { recordCallPlacement, placeRetryCall } from "./prepare";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";
process.env.CALL_PROVIDER = "simulated";

const T1059 = new Date("2026-10-17T05:29:00.000Z"); // 10:59 IST
const T1100 = new Date("2026-10-17T05:30:00.000Z"); // 11:00 IST

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

async function rootCall(id: string, clock: Date) {
  await recordCallPlacement({
    parentId: "parent_kamla",
    clock,
    executionId: id,
    status: "in_progress",
  });
  await query(`update calls set status = 'missed' where id = $1`, [id]);
}

describe("placeRetryCall window and simulated provider", () => {
  it("does not retry at or after 11:00 IST and records retry_skipped_window on the root", async () => {
    await seed();
    const id = "exec_retry_window";
    await rootCall(id, new Date("2026-10-17T03:00:00.000Z"));
    const result = await placeRetryCall("parent_kamla", T1100, id);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "retry_skipped_window");
    const rows = await query<{ result: string }>(`select result from call_attempts where call_id = $1`, [id]);
    assert.ok(rows.some((row) => row.result === "retry_skipped_window"));
  });

  it("simulated provider never fetches even with BOLNA_API_KEY set", async () => {
    await seed();
    const id = "exec_retry_sim";
    await rootCall(id, new Date("2026-10-17T03:00:00.000Z"));
    const urls: string[] = [];
    const prevKey = process.env.BOLNA_API_KEY;
    const prevProvider = process.env.CALL_PROVIDER;
    process.env.BOLNA_API_KEY = "example-test-key-not-live";
    process.env.CALL_PROVIDER = "simulated";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return new Response(JSON.stringify({ execution_id: "should_not" }), { status: 200 });
    }) as typeof fetch;
    try {
      const result = await placeRetryCall("parent_kamla", T1059, id, globalThis.fetch);
      assert.equal(result.ok, true);
      assert.equal(urls.length, 0);
      const rows = await query<{ result: string }>(`select result from call_attempts where call_id = $1`, [id]);
      assert.ok(rows.some((row) => row.result === "retry_placed"));
    } finally {
      globalThis.fetch = originalFetch;
      process.env.BOLNA_API_KEY = prevKey;
      process.env.CALL_PROVIDER = prevProvider;
    }
  });

  it("kill switch blocks the retry and records it on the root", async () => {
    await seed();
    const id = "exec_retry_kill";
    await rootCall(id, new Date("2026-10-17T03:00:00.000Z"));
    const prev = process.env.SAATHI_KILL_SWITCH;
    process.env.SAATHI_KILL_SWITCH = "1";
    try {
      const result = await placeRetryCall("parent_kamla", T1059, id);
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.reason, "kill_switch");
      const rows = await query<{ result: string }>(`select result from call_attempts where call_id = $1`, [id]);
      assert.ok(rows.some((row) => row.result === "kill_switch"));
    } finally {
      process.env.SAATHI_KILL_SWITCH = prev;
    }
  });
});
