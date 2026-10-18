import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { encodeSession } from "@/lib/auth/session";
import { cronAuthorized } from "@/lib/bolna/auth";
import { assertProductionSecrets, bolnaWebhookSecret, cronSecret, toolToken, whatsappVerifyToken } from "@/lib/config";
import { demoModeAllowed } from "@/lib/demo-mode";

const LONG_A = "a".repeat(32);
const LONG_B = "b".repeat(32);
const LONG_C = "c".repeat(32);
const LONG_D = "d".repeat(32);

function withEnv(vars: Record<string, string | undefined>, fn: () => void) {
  const prev: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) {
    prev[key] = process.env[key];
    if (vars[key] === undefined) delete process.env[key];
    else process.env[key] = vars[key];
  }
  try {
    fn();
  } finally {
    for (const key of Object.keys(prev)) {
      if (prev[key] === undefined) delete process.env[key];
      else process.env[key] = prev[key]!;
    }
  }
}

describe("production secrets", () => {
  it("refuses to start in production without a 32+ char SESSION_SECRET", () => {
    withEnv(
      {
        NODE_ENV: "production",
        SESSION_SECRET: undefined,
        MAGIC_LINK_SECRET: undefined,
        SAATHI_TOOL_TOKEN: LONG_A,
        BOLNA_WEBHOOK_SECRET: LONG_B,
      },
      () => {
        assert.throws(() => encodeSession("rohit@example.invalid"), /SESSION_SECRET/);
        assert.throws(() => assertProductionSecrets(), /SESSION_SECRET/);
      },
    );
  });

  it("refuses a short SESSION_SECRET in production", () => {
    withEnv(
      {
        NODE_ENV: "production",
        SESSION_SECRET: "too-short",
        SAATHI_TOOL_TOKEN: LONG_A,
        BOLNA_WEBHOOK_SECRET: LONG_B,
      },
      () => {
        assert.throws(() => encodeSession("rohit@example.invalid"), /32/);
      },
    );
  });

  it("allows the local dev-magic fallback only when NODE_ENV is not production", () => {
    withEnv(
      {
        NODE_ENV: "test",
        SESSION_SECRET: undefined,
        MAGIC_LINK_SECRET: undefined,
      },
      () => {
        const token = encodeSession("rohit@example.invalid");
        assert.match(token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
      },
    );
  });

  it("does not fall the webhook secret back to the tool token", () => {
    withEnv(
      {
        NODE_ENV: "test",
        MOCK_BOLNA: "1",
        SAATHI_TOOL_TOKEN: "dev-tool-token",
        BOLNA_WEBHOOK_SECRET: undefined,
      },
      () => {
        assert.equal(bolnaWebhookSecret(), "");
        assert.notEqual(bolnaWebhookSecret(), toolToken());
      },
    );
  });

  it("requires a 32+ char tool token and a different webhook secret in production", () => {
    withEnv(
      {
        NODE_ENV: "production",
        SESSION_SECRET: LONG_A,
        SAATHI_TOOL_TOKEN: undefined,
        BOLNA_WEBHOOK_SECRET: LONG_B,
        CRON_SECRET: LONG_C,
      },
      () => {
        assert.throws(() => toolToken(), /BOLNA_TOOL_TOKEN|32/);
      },
    );
    withEnv(
      {
        NODE_ENV: "production",
        SESSION_SECRET: LONG_A,
        BOLNA_TOOL_TOKEN: LONG_A,
        SAATHI_TOOL_TOKEN: undefined,
        BOLNA_WEBHOOK_SECRET: LONG_A,
        CRON_SECRET: LONG_C,
      },
      () => {
        assert.throws(() => assertProductionSecrets(), /differ/);
      },
    );
    withEnv(
      {
        NODE_ENV: "production",
        SESSION_SECRET: LONG_A,
        BOLNA_TOOL_TOKEN: LONG_A,
        SAATHI_TOOL_TOKEN: undefined,
        BOLNA_WEBHOOK_SECRET: LONG_B,
        CRON_SECRET: LONG_C,
      },
      () => {
        assert.throws(() => assertProductionSecrets(), /SESSION_SECRET must differ/);
      },
    );
    withEnv(
      {
        NODE_ENV: "production",
        SESSION_SECRET: LONG_D,
        BOLNA_TOOL_TOKEN: LONG_A,
        SAATHI_TOOL_TOKEN: undefined,
        BOLNA_WEBHOOK_SECRET: LONG_B,
        CRON_SECRET: LONG_C,
      },
      () => {
        assert.equal(toolToken(), LONG_A);
        assert.equal(bolnaWebhookSecret(), LONG_B);
        assert.doesNotThrow(() => assertProductionSecrets());
      },
    );
  });

  it("SESSION_SECRET must differ from the tool token and webhook secret", () => {
    withEnv(
      {
        NODE_ENV: "production",
        SESSION_SECRET: LONG_A,
        BOLNA_TOOL_TOKEN: LONG_A,
        BOLNA_WEBHOOK_SECRET: LONG_B,
        CRON_SECRET: LONG_C,
      },
      () => {
        assert.throws(() => assertProductionSecrets(), /SESSION_SECRET must differ/);
      },
    );
  });

  it("production + MOCK_BOLNA=1 + no CRON_SECRET throws", () => {
    withEnv(
      {
        NODE_ENV: "production",
        MOCK_BOLNA: "1",
        SESSION_SECRET: LONG_A,
        BOLNA_TOOL_TOKEN: LONG_B,
        SAATHI_TOOL_TOKEN: undefined,
        BOLNA_WEBHOOK_SECRET: LONG_C,
        CRON_SECRET: undefined,
      },
      () => {
        assert.throws(() => cronSecret(), /CRON_SECRET/);
        assert.throws(() => assertProductionSecrets(), /CRON_SECRET/);
      },
    );
  });

  it("Bearer dev-cron is 401 in production", () => {
    withEnv(
      {
        NODE_ENV: "production",
        MOCK_BOLNA: "1",
        SESSION_SECRET: LONG_A,
        BOLNA_TOOL_TOKEN: LONG_B,
        BOLNA_WEBHOOK_SECRET: LONG_C,
        CRON_SECRET: LONG_D,
      },
      () => {
        assert.equal(
          cronAuthorized(new Request("http://local/api/cron/tick", { headers: { authorization: "Bearer dev-cron" } })),
          false,
        );
        assert.equal(
          cronAuthorized(new Request("http://local/api/cron/tick", { headers: { authorization: `Bearer ${LONG_D}` } })),
          true,
        );
      },
    );
  });

  it("does not fall WhatsApp verify back to dev-wa-verify in production", () => {
    withEnv(
      {
        NODE_ENV: "production",
        MOCK_WHATSAPP: "1",
        WHATSAPP_VERIFY_TOKEN: undefined,
      },
      () => {
        assert.equal(whatsappVerifyToken(), "");
        assert.notEqual(whatsappVerifyToken(), "dev-wa-verify");
      },
    );
  });
});

describe("demo mock gate", () => {
  it("is off if mock WhatsApp is off even when calls are simulated", () => {
    withEnv({ CALL_PROVIDER: "simulated", MOCK_BOLNA: "1", MOCK_WHATSAPP: "0" }, () => {
      assert.equal(demoModeAllowed(), false);
    });
  });

  it("is off if mock Bolna is off even when WhatsApp is mocked", () => {
    withEnv({ CALL_PROVIDER: "bolna", MOCK_BOLNA: "0", MOCK_WHATSAPP: "1" }, () => {
      assert.equal(demoModeAllowed(), false);
    });
  });

  it("is on only when both mocks are on", () => {
    withEnv({ CALL_PROVIDER: "simulated", MOCK_BOLNA: "1", MOCK_WHATSAPP: "1" }, () => {
      assert.equal(demoModeAllowed(), true);
    });
  });
});
