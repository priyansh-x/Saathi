import { closeDb, migrationIo } from "./client";
import { applyMigrations } from "./migrate";

applyMigrations(migrationIo())
  .then((applied) => {
    console.log(JSON.stringify({ ok: true, applied, driver: process.env.DATABASE_URL ? "postgres" : "pglite" }));
    return closeDb();
  })
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error(err);
    await closeDb().catch(() => undefined);
    process.exit(1);
  });
