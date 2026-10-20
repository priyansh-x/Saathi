import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { MIGRATION_SOURCES } from "@/lib/db/migration-sources";
import { nowIstStamp } from "@/lib/time";

export function migrationsDir() {
  return path.join(process.cwd(), "src/lib/db/migrations");
}

export function listMigrationFiles() {
  return readdirSync(migrationsDir())
    .filter((name) => /^\d{3}_.+\.sql$/.test(name))
    .sort();
}

export type MigrationExec = {
  exec: (sql: string) => Promise<void>;
  query: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
};

export async function applyMigrations(io: MigrationExec) {
  await io.exec(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at text not null
    )
  `);
  const applied = await io.query<{ id: string }>(`select id from schema_migrations`);
  const done = new Set(applied.map((row) => row.id));
  const appliedNow: string[] = [];
  const sources = MIGRATION_SOURCES.length
    ? MIGRATION_SOURCES
    : listMigrationFiles().map((file) => ({
        id: file.replace(/\.sql$/, ""),
        sql: readFileSync(path.join(migrationsDir(), file), "utf8"),
      }));
  for (const { id, sql } of sources) {
    if (done.has(id)) continue;
    await io.exec(sql);
    const at = nowIstStamp();
    if (at.endsWith("Z")) throw new Error("schema_migrations timestamps must be +05:30");
    await io.query(`insert into schema_migrations (id, applied_at) values ($1, $2)`, [id, at]);
    appliedNow.push(id);
  }
  return appliedNow;
}
