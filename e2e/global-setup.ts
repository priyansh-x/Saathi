import { execSync } from "node:child_process";

export default function globalSetup() {
  execSync("npx tsx src/lib/db/seed-cli.ts", {
    stdio: "inherit",
    env: { ...process.env, PGLITE_PATH: process.env.PGLITE_PATH || ".data/saathi-e2e" },
  });
}
