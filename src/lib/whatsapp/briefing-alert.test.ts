import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";
import { isWhatsappTemplateApproved } from "@/lib/config";
import { evaluateWhatsappGate, metaRecipientDigits } from "@/lib/whatsapp/gate";
import { notifyAlert, sendDailyBriefing } from "@/lib/whatsapp/notify";
import { previewFamilyMessage } from "@/lib/whatsapp/preview";
import { authorizeWhatsappPost, signWhatsappBody } from "@/lib/whatsapp/signature";
import { applyWhatsappStatuses, parseWhatsappStatuses } from "@/lib/whatsapp/delivery";
import { buildWhatsappPayload, outboundMessageId, sendFamilyMessage, sessionWindowOpen } from "@/lib/whatsapp/send";
import { processInboundMessages } from "@/lib/whatsapp/inbound";
import { nowIstStamp } from "@/lib/time";
import { readFileSync } from "node:fs";
import path from "node:path";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.MOCK_EMAIL = "1";
process.env.SAATHI_KILL_SWITCH = "0";
process.env.CALL_PROVIDER = "simulated";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("WhatsApp gating order (pure)", () => {
  it("blocks kill switch, then opt-in, then opt-out, then allowlist, then unapproved, then mock vs live", () => {
    const kill = evaluateWhatsappGate({
      killSwitch: true, optedIn: true, optedOut: false, gateOk: true, approved: true, mock: true,
    });
    assert.equal(kill.ok, false);
    const noOpt = evaluateWhatsappGate({
      killSwitch: false, optedIn: false, optedOut: false, gateOk: true, approved: true, mock: false,
    });
    assert.equal(noOpt.ok, false);
    if (!noOpt.ok) assert.equal(noOpt.blocked, "not_opted_in");
    const out = evaluateWhatsappGate({
      killSwitch: false, optedIn: true, optedOut: true, gateOk: true, approved: true, mock: false,
    });
    assert.equal(out.ok, false);
    if (!out.ok) assert.equal(out.blocked, "opted_out");
    const allow = evaluateWhatsappGate({
      killSwitch: false, optedIn: true, optedOut: false, gateOk: false, gateReason: "not_allowlisted", approved: true, mock: false,
    });
    assert.equal(allow.ok, false);
    if (!allow.ok) assert.equal(allow.blocked, "not_allowlisted");
    const unapp = evaluateWhatsappGate({
      killSwitch: false, optedIn: true, optedOut: false, gateOk: true, approved: false, mock: false,
    });
    assert.equal(unapp.ok, false);
    if (!unapp.ok) assert.equal(unapp.blocked, "unapproved_template");
    const mocked = evaluateWhatsappGate({
      killSwitch: false, optedIn: true, optedOut: false, gateOk: true, approved: true, mock: true,
    });
    assert.equal(mocked.ok, true);
    if (mocked.ok) assert.equal(mocked.next, "mock");
    const live = evaluateWhatsappGate({
      killSwitch: false, optedIn: true, optedOut: false, gateOk: true, approved: true, mock: false,
    });
    assert.equal(live.ok, true);
    if (live.ok) assert.equal(live.next, "live");
  });
});

describe("payload shape and 24h window", () => {
  it("builds a template payload with recipient_type, language, ordered body params, and E.164 digits without +", () => {
    const payload = buildWhatsappPayload({
      to: "+919999999999",
      template: "daily_briefing_good",
      language: "hi",
      vars: ["Rohit", "Kamla", "8:04", "ok", "theek"],
    });
    assert.equal(payload.messaging_product, "whatsapp");
    assert.equal(payload.recipient_type, "individual");
    assert.equal(payload.type, "template");
    assert.equal(payload.to, "919999999999");
    assert.equal(payload.template?.name, "daily_briefing_good");
    assert.equal(payload.template?.language.code, "hi");
    const body = payload.template?.components?.[0] as { type: string; parameters: { text: string }[] };
    assert.equal(body.type, "body");
    assert.deepEqual(body.parameters.map((p) => p.text), ["Rohit", "Kamla", "8:04", "ok", "theek"]);
    assert.equal(metaRecipientDigits("+919888888888"), "919888888888");
  });

  it("never sends free-form text outside the 24h window", () => {
    assert.equal(sessionWindowOpen(null), false);
    const closed = buildWhatsappPayload({
      to: "+919999999999",
      template: "daily_briefing_good",
      language: "en",
      vars: ["a", "b", "c", "d", "e"],
      freeText: "EXAMPLE free form",
      windowOpen: false,
    });
    assert.equal(closed.type, "template");
    const open = buildWhatsappPayload({
      to: "+919999999999",
      template: "daily_briefing_good",
      language: "en",
      vars: ["a"],
      freeText: "EXAMPLE free form",
      windowOpen: true,
    });
    assert.equal(open.type, "text");
  });
});

describe("language pick and idempotency keys", () => {
  it("uses the child's desk locale and briefing:{call_id} / alert:{id}:{level}", async () => {
    await seed();
    await query(`update contacts set locale = 'hi', whatsapp_opt_in = true where id = 'contact_rohit'`);
    const callId = `brief_key_${Date.now()}`;
    const first = await sendDailyBriefing("parent_kamla", {
      id: callId,
      mood_quote: "Theek thi.",
      status: "completed",
    });
    assert.equal(first.ok, true);
    const second = await sendDailyBriefing("parent_kamla", {
      id: callId,
      mood_quote: "Theek thi.",
      status: "completed",
    });
    assert.equal(second.ok, true);
    if (second.ok) assert.equal(second.results[0]?.status, "duplicate");
    assert.equal(outboundMessageId("daily_briefing_good", `briefing:${callId}`).includes("briefing:"), true);
    await query(`update contacts set locale = 'en' where id = 'contact_rohit'`);

    const alertId = `alert_key_${Date.now()}`;
    await notifyAlert("parent_kamla", {
      id: alertId,
      quote: "Seene mein dard.",
      created_at: "2026-10-18T08:33:00+05:30",
      category: "EMERGENCY",
      level: "act",
    });
    const again = await notifyAlert("parent_kamla", {
      id: alertId,
      quote: "Seene mein dard.",
      created_at: "2026-10-18T08:33:00+05:30",
      category: "EMERGENCY",
      level: "act",
    });
    assert.ok(again.results?.some((row) => row.status === "duplicate"));
  });
});

describe("opt-out STOP/band", () => {
  it("sets whatsapp_opted_out_at on STOP and band", async () => {
    await seed();
    await processInboundMessages([{ from: "919999999999", type: "text", text: { body: "STOP" } }]);
    await query(`update contacts set phone = '+919999999999' where id = 'contact_rohit'`);
    await processInboundMessages([{ from: "919999999999", type: "text", text: { body: "STOP" } }]);
    const row = await query<{ whatsapp_opt_in: boolean; whatsapp_opted_out_at: string | null }>(
      `select whatsapp_opt_in, whatsapp_opted_out_at from contacts where id = 'contact_rohit'`,
    );
    assert.equal(row[0]?.whatsapp_opt_in, false);
    assert.ok(row[0]?.whatsapp_opted_out_at);
    await seed();
    await processInboundMessages([{ from: "+910000000001", type: "text", text: { body: "band" } }]);
    const band = await query<{ whatsapp_opted_out_at: string | null }>(
      `select whatsapp_opted_out_at from contacts where id = 'contact_rohit'`,
    );
    assert.ok(band[0]?.whatsapp_opted_out_at);
  });
});

describe("kill switch and fallback chain", () => {
  it("blocks WhatsApp when the kill switch is on", async () => {
    const prev = process.env.SAATHI_KILL_SWITCH;
    process.env.SAATHI_KILL_SWITCH = "1";
    try {
      const sent = await sendFamilyMessage({
        parentId: "parent_kamla",
        toPhone: "+910000000001",
        locale: "en",
        intended: "daily_briefing_good",
        vars: ["Rohit", "Kamla", "8:04", "ok", "quote"],
        idempotencyKey: `kill_${Date.now()}`,
      });
      assert.equal(sent.status, "kill_switch");
      assert.equal(sent.ok, false);
    } finally {
      process.env.SAATHI_KILL_SWITCH = prev;
    }
  });

  it("falls back to push then email when the template is not approved (fetch stub, no Graph)", async () => {
    const prev = {
      mock: process.env.MOCK_WHATSAPP,
      approved: process.env.WHATSAPP_TEMPLATES_APPROVED,
      list: process.env.WHATSAPP_APPROVED_TEMPLATES,
      phones: process.env.ALLOWED_PHONE_NUMBERS,
      emails: process.env.ALLOWED_EMAILS,
    };
    const urls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    process.env.MOCK_WHATSAPP = "1";
    process.env.WHATSAPP_TEMPLATES_APPROVED = "0";
    process.env.WHATSAPP_APPROVED_TEMPLATES = "";
    try {
      const preview = previewFamilyMessage({
        toPhone: "+919999999999",
        locale: "en",
        template: "daily_briefing_good",
        vars: ["Rohit", "Kamla", "8:04", "ok", "quote"],
        storedOptIn: true,
        optedOut: false,
      });
      assert.match(preview.gate, /push\/email|unapproved/);
      assert.equal(isWhatsappTemplateApproved("daily_briefing_good", "en"), false);
      assert.equal(urls.length, 0);
    } finally {
      globalThis.fetch = original;
      process.env.MOCK_WHATSAPP = prev.mock;
      process.env.WHATSAPP_TEMPLATES_APPROVED = prev.approved;
      if (prev.list) process.env.WHATSAPP_APPROVED_TEMPLATES = prev.list;
      else delete process.env.WHATSAPP_APPROVED_TEMPLATES;
      process.env.ALLOWED_PHONE_NUMBERS = prev.phones;
      process.env.ALLOWED_EMAILS = prev.emails;
    }
  });
});

describe("webhook signature and statuses", () => {
  it("accepts a good signature, 401 on a bad one, and refuses a missing secret", () => {
    const raw = `{"object":"whatsapp_business_account"}`;
    const secret = "example-app-secret";
    const good = signWhatsappBody(raw, secret);
    assert.equal(authorizeWhatsappPost({ mock: false, secret, header: good, raw }).ok, true);
    const bad = authorizeWhatsappPost({ mock: false, secret, header: "sha256=deadbeef", raw });
    assert.equal(bad.ok, false);
    if (!bad.ok) assert.equal(bad.status, 401);
    const missing = authorizeWhatsappPost({ mock: false, secret: "", header: good, raw });
    assert.equal(missing.ok, false);
    if (!missing.ok) assert.equal(missing.reason, "missing_app_secret");
  });

  it("maps delivery statuses and does not re-run fallback on replay", async () => {
    const wamid = `wamid.EXAMPLE.status_${Date.now()}`;
    const id = `out_status_${Date.now()}`;
    await query(
      `insert into outbound_messages (
        id, parent_id, channel, template, to_phone, body, at, status, is_example,
        provider_message_id, delivery_status, delivery_at
      ) values ($1,'parent_kamla','whatsapp','daily_briefing_good','+919999999999','EXAMPLE',$2,'sent',true,$3,'sent',$2)`,
      [id, nowIstStamp(), wamid],
    );
    const raw = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [{ changes: [{ value: { statuses: [{ id: wamid, status: "delivered", timestamp: "1760782320" }] } }] }],
    });
    const first = await applyWhatsappStatuses(parseWhatsappStatuses(raw));
    const second = await applyWhatsappStatuses(parseWhatsappStatuses(raw));
    assert.equal(first.length, 1);
    assert.equal(second.length, 0);
    const row = await query<{ delivery_status: string; status: string }>(
      `select delivery_status, status from outbound_messages where id = $1`,
      [id],
    );
    assert.equal(row[0]?.delivery_status, "delivered");
    assert.equal(row[0]?.status, "delivered");
  });

});

describe("admin preview never calls fetch", () => {
  it("renders template, language, body, masked phone, and never fetches", () => {
    const urls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      urls.push(String(input));
      throw new Error("preview must not fetch");
    }) as typeof fetch;
    try {
      const preview = previewFamilyMessage({
        toPhone: "+919888888888",
        locale: "en",
        template: "safety_alert_emergency",
        vars: ["Rohit", "Kamla", "quote", "8:09", "https://saathi.example/d/example-kamla"],
        storedOptIn: true,
        optedOut: false,
      });
      assert.equal(preview.template, "safety_alert_emergency");
      assert.equal(preview.language, "en");
      assert.match(preview.body, /Saathi alert for Rohit/);
      assert.match(preview.payloadJson, /\*\*\*\*8888/);
      assert.doesNotMatch(preview.payloadJson, /Bearer /);
      assert.equal(urls.length, 0);
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe("DRAFT template files", () => {
  it("ships Status: DRAFT files for briefing and safety templates", () => {
    const dir = path.join(process.cwd(), "docs/saathi/whatsapp/templates");
    for (const name of [
      "daily_briefing_good.en",
      "daily_briefing_good.hi",
      "daily_briefing_missed_med.en",
      "daily_briefing_missed_med.hi",
      "daily_briefing_low_mood.en",
      "daily_briefing_low_mood.hi",
      "safety_alert_emergency.en",
      "safety_alert_emergency.hi",
      "safety_alert_unreachable.en",
      "safety_alert_unreachable.hi",
      "safety_alert_urgent.en",
      "safety_alert_urgent.hi",
      "safety_alert_emergency_solo.en",
      "safety_alert_unreachable_solo.en",
      "safety_alert_urgent_solo.en",
    ]) {
      const text = readFileSync(path.join(dir, `${name}.md`), "utf8");
      assert.match(text, /Status: DRAFT/);
      assert.match(text, /Category: UTILITY/);
    }
  });
});
