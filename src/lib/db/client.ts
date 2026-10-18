import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import path from "node:path";

const globalForDb = globalThis as unknown as { saathiDb?: PGlite; saathiReady?: Promise<PGlite> };

function schemaPath() {
  return path.join(process.cwd(), "src/lib/db/schema.sql");
}

async function open() {
  mkdirSync(path.join(process.cwd(), ".data"), { recursive: true });
  const db = new PGlite(path.join(process.cwd(), ".data/saathi"));
  await db.waitReady;
  const sql = readFileSync(schemaPath(), "utf8");
  await db.exec(sql);
  const phase2 = path.join(process.cwd(), "src/lib/db/migrations/002_phase2.sql");
  await db.exec(readFileSync(phase2, "utf8"));
  const phase4 = path.join(process.cwd(), "src/lib/db/migrations/003_phase4.sql");
  await db.exec(readFileSync(phase4, "utf8"));
  const mood = path.join(process.cwd(), "src/lib/db/migrations/004_mood.sql");
  await db.exec(readFileSync(mood, "utf8"));
  const contactsEmail = path.join(process.cwd(), "src/lib/db/migrations/005_contacts_email.sql");
  await db.exec(readFileSync(contactsEmail, "utf8"));
  const parentConsent = path.join(process.cwd(), "src/lib/db/migrations/006_parent_consent.sql");
  await db.exec(readFileSync(parentConsent, "utf8"));
  const deletedEvents = path.join(process.cwd(), "src/lib/db/migrations/007_deleted_events.sql");
  await db.exec(readFileSync(deletedEvents, "utf8"));
  const consentLater = path.join(process.cwd(), "src/lib/db/migrations/008_consent_later.sql");
  await db.exec(readFileSync(consentLater, "utf8"));
  const signup = path.join(process.cwd(), "src/lib/db/migrations/009_signup.sql");
  await db.exec(readFileSync(signup, "utf8"));
  const audit = path.join(process.cwd(), "src/lib/db/migrations/010_audit.sql");
  await db.exec(readFileSync(audit, "utf8"));
  return db;
}

export async function getDb() {
  if (globalForDb.saathiDb) return globalForDb.saathiDb;
  if (!globalForDb.saathiReady) {
    globalForDb.saathiReady = open().then((db) => {
      globalForDb.saathiDb = db;
      return db;
    });
  }
  return globalForDb.saathiReady;
}

export async function query<T>(sql: string, params: unknown[] = []) {
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
}
