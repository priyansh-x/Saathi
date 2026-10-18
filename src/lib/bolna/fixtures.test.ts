import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { parseWebhook } from "../calls/provider";
import { closeDb, query } from "../db/client";
import { seed } from "../db/seed";
import { isMissedBolnaStatus, type BolnaWebhook } from "./webhook";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";

const DIR = path.join(process.cwd(), "fixtures/bolna");

type FixtureFile = { file: string; body: BolnaWebhook & { saathi_fixture?: string; id?: string } };

function loadJsonFixtures(): FixtureFile[] {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR)
    .filter((name) => name.endsWith(".json"))
    .map((file) => ({
      file,
      body: JSON.parse(readFileSync(path.join(DIR, file), "utf8")) as FixtureFile["body"],
    }));
}

const fixtures = loadJsonFixtures();
const empty = fixtures.length === 0;
const realFixtures = fixtures.filter((f) => !f.file.startsWith("synthetic_"));
const noReal = realFixtures.length === 0;

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("bolna payload fixtures", () => {
  it("skips cleanly when fixtures/bolna has no JSON", { skip: !empty }, () => {
    assert.equal(fixtures.length, 0);
  });

  it("loads every JSON and keeps synthetic files labelled", { skip: empty }, () => {
    assert.ok(fixtures.length > 0);
    for (const { file, body } of fixtures) {
      if (file.startsWith("synthetic_")) {
        assert.equal(body.saathi_fixture, "synthetic");
      } else {
        assert.notEqual(body.saathi_fixture, "synthetic");
      }
      assert.match(JSON.stringify(body), /\+910000000000|\{\{|parent_kamla|synthetic/);
    }
  });

  it("completed once", { skip: empty }, async () => {
    const hit = fixtures.find(
      (f) => f.body.status === "completed" && Number(f.body.conversation_duration ?? 0) > 0,
    );
    assert.ok(hit, "need a completed fixture with duration");
    const sid = `fix_once_${Date.now()}`;
    const result = await parseWebhook({ ...hit.body, id: sid }, sid);
    assert.equal("call_id" in result && result.call_id, sid);
    const rows = await query<{ n: number }>(
      `select count(*)::int as n from calls where bolna_execution_id = $1 or id = $1`,
      [sid],
    );
    assert.equal(rows[0]?.n, 1);
  });

  it("delivered 3 times is idempotent", { skip: empty }, async () => {
    const hit = fixtures.find(
      (f) => f.body.status === "completed" && Number(f.body.conversation_duration ?? 0) > 0,
    );
    assert.ok(hit);
    const sid = `fix_replay_${Date.now()}`;
    const body = { ...hit.body, id: sid };
    const a = await parseWebhook(body, sid);
    const b = await parseWebhook(body, sid);
    const c = await parseWebhook(body, sid);
    assert.equal("call_id" in a && a.call_id, sid);
    assert.equal("replay" in b && b.replay, true);
    assert.equal("replay" in c && c.replay, true);
    const rows = await query<{ n: number }>(
      `select count(*)::int as n from calls where bolna_execution_id = $1 or id = $1`,
      [sid],
    );
    assert.equal(rows[0]?.n, 1);
  });

  it("zero duration is no conversation", { skip: empty }, async () => {
    const hit = fixtures.find(
      (f) => f.body.status === "completed" && Number(f.body.conversation_duration ?? 0) <= 0,
    );
    assert.ok(hit, "need a completed fixture with duration 0");
    const sid = `fix_zero_${Date.now()}`;
    const result = await parseWebhook({ ...hit.body, id: sid }, sid);
    assert.equal("status" in result && result.status, "no_conversation");
  });

  it("real fixtures expose telephony_data, extracted_data, and context_details", { skip: noReal }, () => {
    for (const { body } of realFixtures) {
      assert.ok(body.context_details?.recipient_data);
      assert.ok("telephony_data" in body);
      assert.ok("extracted_data" in body);
      assert.ok(body.status);
    }
  });

  it("non-completed status is ignored", { skip: empty }, async () => {
    const hit = fixtures.find(
      (f) => f.body.status && f.body.status !== "completed" && !isMissedBolnaStatus(f.body.status),
    );
    assert.ok(hit, "need a non-completed fixture that is not a missed-call status");
    const sid = `fix_ring_${Date.now()}`;
    const result = await parseWebhook({ ...hit.body, id: sid }, sid);
    assert.equal("ignored" in result && result.ignored, true);
    const rows = await query<{ n: number }>(`select count(*)::int as n from calls where id = $1`, [sid]);
    assert.equal(rows[0]?.n, 0);
  });
});
