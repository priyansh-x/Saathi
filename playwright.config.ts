import { defineConfig } from "@playwright/test";

const PORT = 43197;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    viewport: { width: 360, height: 740 },
    isMobile: true,
    hasTouch: true,
  },
  webServer: {
    command: `npx next start --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      MOCK_BOLNA: "1",
      MOCK_WHATSAPP: "1",
      CALL_PROVIDER: "simulated",
      SAATHI_KILL_SWITCH: "0",
      PGLITE_PATH: ".data/saathi-e2e",
      // next start is NODE_ENV=production; public hosts have no dev-* fallbacks.
      SESSION_SECRET: "e2e-session-secret-32chars-minimum",
      BOLNA_TOOL_TOKEN: "e2e-bolna-tool-token-32chars-min",
      BOLNA_WEBHOOK_SECRET: "e2e-webhook-secret-32chars-minxx",
      CRON_SECRET: "e2e-cron-secret-32chars-minimumxxx",
    },
  },
});
