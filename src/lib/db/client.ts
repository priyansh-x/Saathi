import { PGlite } from "@electric-sql/pglite";
import type { Pool } from "pg";
import { applyMigrations, type MigrationExec } from "@/lib/db/migrate";
import { latchOpsKillSwitch } from "@/lib/ops/flags";

const globalForDb = globalThis as unknown as {
  saathiDb?: PGlite;
  saathiReady?: Promise<PGlite>;
  saathiPool?: Pool;
  saathiPoolReady?: Promise<Pool>;
};

export function databaseUrl() {
  return (process.env.DATABASE_URL || "").trim();
}

export function usingPostgres() {
  return Boolean(databaseUrl());
}

function pgliteIo(db: PGlite): MigrationExec {
  return {
    exec: async (sql) => {
      await db.exec(sql);
    },
    query: async <T>(sql: string, params: unknown[] = []) => {
      const result = await db.query<T>(sql, params);
      return result.rows;
    },
  };
}

function postgresIo(pool: Pool): MigrationExec {
  return {
    exec: async (sql) => {
      await pool.query(sql);
    },
    query: async <T>(sql: string, params: unknown[] = []) => {
      const result = await pool.query(sql, params);
      return result.rows as T[];
    },
  };
}

export function migrationIo(): MigrationExec {
  return {
    exec: async (sql) => {
      if (usingPostgres()) {
        const pool = await getPool();
        await pool.query(sql);
        return;
      }
      const db = await getDb();
      await db.exec(sql);
    },
    query: async <T>(sql: string, params: unknown[] = []) => query<T>(sql, params),
  };
}

async function loadKillLatch(io: MigrationExec) {
  try {
    const rows = await io.query<{ value: string }>(`select value from ops_flags where key = 'kill_switch'`);
    latchOpsKillSwitch(rows[0]?.value === "1");
  } catch {
    latchOpsKillSwitch(false);
  }
}

/** Disk dir for PGlite, or `null` for in-memory (Vercel / explicit `:memory:`). */
export function pgliteDataDir(env: Record<string, string | undefined> = process.env): string | null {
  const explicit = (env.PGLITE_PATH || "").trim();
  if (explicit === ":memory:") return null;
  if (explicit) return explicit;
  // Lambda cwd is read-only; /tmp is writable. In-memory WASM still needs a dir
  // for some PGlite builds, so prefer /tmp over `new PGlite()`.
  if (env.VERCEL || env.AWS_LAMBDA_FUNCTION_NAME) return "/tmp/saathi-pglite";
  return ".data/saathi";
}

async function openPglite() {
  const dir = pgliteDataDir();
  let db: PGlite;
  if (dir) {
    const { mkdirSync } = await import("node:fs");
    const path = await import("node:path");
    const full = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
    mkdirSync(full, { recursive: true });
    db = new PGlite(full);
  } else {
    db = new PGlite();
  }
  await db.waitReady;
  const io = pgliteIo(db);
  await applyMigrations(io);
  await loadKillLatch(io);
  return db;
}

async function openPool() {
  const { Pool } = await import("pg");
  const url = databaseUrl();
  const ssl = /sslmode=require|supabase\.co/i.test(url) ? { rejectUnauthorized: false } : undefined;
  const pool = new Pool({ connectionString: url, ssl });
  const io = postgresIo(pool);
  await applyMigrations(io);
  await loadKillLatch(io);
  return pool;
}

export async function getDb() {
  if (usingPostgres()) {
    throw new Error("getDb() is PGlite-only. Use query() when DATABASE_URL is set.");
  }
  if (globalForDb.saathiDb) return globalForDb.saathiDb;
  if (!globalForDb.saathiReady) {
    globalForDb.saathiReady = openPglite().then((db) => {
      globalForDb.saathiDb = db;
      return db;
    });
  }
  return globalForDb.saathiReady;
}

export async function getPool() {
  if (!usingPostgres()) {
    throw new Error("getPool() needs DATABASE_URL.");
  }
  if (globalForDb.saathiPool) return globalForDb.saathiPool;
  if (!globalForDb.saathiPoolReady) {
    globalForDb.saathiPoolReady = openPool().then((pool) => {
      globalForDb.saathiPool = pool;
      return pool;
    });
  }
  return globalForDb.saathiPoolReady;
}

export async function query<T>(sql: string, params: unknown[] = []) {
  if (usingPostgres()) {
    const pool = await getPool();
    const result = await pool.query(sql, params);
    return result.rows as T[];
  }
  const db = await getDb();
  const result = await db.query<T>(sql, params);
  return result.rows;
}

export async function closeDb() {
  if (globalForDb.saathiDb) {
    await globalForDb.saathiDb.close();
    globalForDb.saathiDb = undefined;
    globalForDb.saathiReady = undefined;
  }
  if (globalForDb.saathiPool) {
    await globalForDb.saathiPool.end();
    globalForDb.saathiPool = undefined;
    globalForDb.saathiPoolReady = undefined;
  }
}
