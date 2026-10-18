import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, migrationIo, query, usingPostgres } from "./client";
import { applyMigrations, listMigrationFiles } from "./migrate";
import { seed } from "./seed";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("db migrate", () => {
  it("runs tests on PGlite when DATABASE_URL is unset", () => {
    assert.equal(usingPostgres(), false);
  });

  it("lists numbered SQL files in order, including RLS", () => {
    const files = listMigrationFiles();
    assert.equal(files[0], "001_init.sql");
    assert.ok(files.includes("013_rls.sql"));
    const ids = files.map((name) => name.slice(0, 3));
    assert.deepEqual(ids, [...ids].sort());
  });

  it("applies migrations idempotently into schema_migrations", async () => {
    const first = await applyMigrations(migrationIo());
    const second = await applyMigrations(migrationIo());
    assert.deepEqual(second, []);
    const rows = await query<{ id: string }>(`select id from schema_migrations order by id`);
    assert.ok(rows.some((row) => row.id === "001_init"));
    assert.ok(rows.some((row) => row.id === "013_rls"));
    assert.ok(first.length === 0 || first.includes("013_rls") || rows.length >= 13);
  });
});
