import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";
import { loadWhatsappReadiness, markWhatsappWebhookVerified, whatsappEnvChecks } from "./whatsapp-readiness";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("WhatsApp readiness", () => {
  it("never includes secret values", async () => {
    const prev = {
      token: process.env.WHATSAPP_TOKEN,
      phone: process.env.WHATSAPP_PHONE_NUMBER_ID,
      secret: process.env.WHATSAPP_APP_SECRET,
    };
    process.env.WHATSAPP_TOKEN = "super-secret-wa-token-do-not-leak";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "secret-phone-number-id-999";
    process.env.WHATSAPP_APP_SECRET = "super-secret-app-secret-do-not-leak";
    try {
      const snap = await loadWhatsappReadiness();
      const blob = JSON.stringify(snap);
      assert.doesNotMatch(blob, /super-secret-wa-token-do-not-leak/);
      assert.doesNotMatch(blob, /secret-phone-number-id-999/);
      assert.doesNotMatch(blob, /super-secret-app-secret-do-not-leak/);
      assert.equal(snap.checks.find((c) => c.id === "token")?.detail, "set");
      assert.equal(snap.checks.find((c) => c.id === "phone_number_id")?.detail, "set");
      assert.equal(snap.checks.find((c) => c.id === "app_secret")?.detail, "set");
    } finally {
      if (prev.token) process.env.WHATSAPP_TOKEN = prev.token;
      else delete process.env.WHATSAPP_TOKEN;
      if (prev.phone) process.env.WHATSAPP_PHONE_NUMBER_ID = prev.phone;
      else delete process.env.WHATSAPP_PHONE_NUMBER_ID;
      if (prev.secret) process.env.WHATSAPP_APP_SECRET = prev.secret;
      else delete process.env.WHATSAPP_APP_SECRET;
    }
  });

  it("is red when secrets are missing", () => {
    const prev = {
      token: process.env.WHATSAPP_TOKEN,
      phone: process.env.WHATSAPP_PHONE_NUMBER_ID,
      secret: process.env.WHATSAPP_APP_SECRET,
    };
    delete process.env.WHATSAPP_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    delete process.env.WHATSAPP_APP_SECRET;
    try {
      const checks = whatsappEnvChecks();
      assert.equal(checks.find((c) => c.id === "token")?.ok, false);
      assert.equal(checks.find((c) => c.id === "phone_number_id")?.ok, false);
      assert.equal(checks.find((c) => c.id === "app_secret")?.ok, false);
    } finally {
      if (prev.token) process.env.WHATSAPP_TOKEN = prev.token;
      if (prev.phone) process.env.WHATSAPP_PHONE_NUMBER_ID = prev.phone;
      if (prev.secret) process.env.WHATSAPP_APP_SECRET = prev.secret;
    }
  });

  it("marks webhook verified and reports last inbound and last status times only", async () => {
    await markWhatsappWebhookVerified();
    await query(`update contacts set last_inbound_at = $2 where id = $1`, [
      "contact_rohit",
      "2026-10-18T08:10:00+05:30",
    ]);
    await query(
      `insert into webhook_events values ($1,'whatsapp','status',$2,$3,true)`,
      ["wh_wa_status_example", '{"statuses":[{"status":"delivered"}]}', "2026-10-18T08:12:00+05:30"],
    );
    const snap = await loadWhatsappReadiness();
    assert.equal(snap.checks.find((c) => c.id === "webhook_verified")?.ok, true);
    assert.equal(snap.lastInboundAt, "2026-10-18T08:10:00+05:30");
    assert.equal(snap.lastStatusAt, "2026-10-18T08:12:00+05:30");
    const blob = JSON.stringify(snap);
    assert.doesNotMatch(blob, /98765/);
    assert.doesNotMatch(blob, /Rohit/);
  });
});
