import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";
import { loadOpsSnapshot } from "@/lib/ops/snapshot";
import { latestUndeliveredEmail } from "@/lib/whatsapp/delivery";
import { sendFamilyMessage } from "@/lib/whatsapp/send";
import { selectEmailTransport } from "./transport";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

function restoreEmailEnv(prev: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(prev)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

async function fallbackToEmail(key: string) {
  return sendFamilyMessage({
    parentId: "parent_kamla",
    toPhone: "+910000000001",
    locale: "en",
    intended: "daily_briefing_good",
    vars: ["Maa", "8:04", "Good", "—", "—", "http://local"],
    idempotencyKey: key,
  });
}

describe("email fallback transport", () => {
  it("marks the row undelivered when mocks are off and no transport is set up", async () => {
    const prev = {
      MOCK_WHATSAPP: process.env.MOCK_WHATSAPP,
      MOCK_EMAIL: process.env.MOCK_EMAIL,
      ALLOWED_PHONE_NUMBERS: process.env.ALLOWED_PHONE_NUMBERS,
      ALLOWED_EMAILS: process.env.ALLOWED_EMAILS,
      WHATSAPP_TEMPLATES_APPROVED: process.env.WHATSAPP_TEMPLATES_APPROVED,
      WHATSAPP_APPROVED_TEMPLATES: process.env.WHATSAPP_APPROVED_TEMPLATES,
      EMAIL_FROM: process.env.EMAIL_FROM,
      EMAIL_API_KEY: process.env.EMAIL_API_KEY,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      SMTP_HOST: process.env.SMTP_HOST,
    };
    const urls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    process.env.MOCK_WHATSAPP = "0";
    process.env.MOCK_EMAIL = "0";
    process.env.WHATSAPP_TEMPLATES_APPROVED = "0";
    process.env.WHATSAPP_APPROVED_TEMPLATES = "";
    process.env.ALLOWED_PHONE_NUMBERS = "+910000000001";
    process.env.ALLOWED_EMAILS = "rohit@example.invalid";
    delete process.env.EMAIL_FROM;
    delete process.env.EMAIL_API_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_HOST;
    try {
      assert.equal(selectEmailTransport(), "none");
      const sent = await fallbackToEmail(`email_none_${Date.now()}`);
      assert.equal(sent.channel, "email");
      assert.equal(sent.status, "undelivered");
      assert.equal(sent.ok, false);
      assert.equal(urls.length, 0);
      const row = await query<{ status: string; delivery_status: string | null; to_phone: string }>(
        `select status, delivery_status, to_phone from outbound_messages where id = $1`,
        [sent.id],
      );
      assert.equal(row[0]?.status, "undelivered");
      assert.equal(row[0]?.delivery_status, "undelivered");
      assert.equal(row[0]?.to_phone, "rohit@example.invalid");
      const reach = await latestUndeliveredEmail("parent_kamla");
      assert.equal(reach?.name, "Rohit");
    } finally {
      globalThis.fetch = original;
      restoreEmailEnv(prev);
    }
  });

  it("mocks the send when MOCK_EMAIL=1 even without Resend or SMTP", async () => {
    const prev = {
      MOCK_WHATSAPP: process.env.MOCK_WHATSAPP,
      MOCK_EMAIL: process.env.MOCK_EMAIL,
      ALLOWED_PHONE_NUMBERS: process.env.ALLOWED_PHONE_NUMBERS,
      ALLOWED_EMAILS: process.env.ALLOWED_EMAILS,
      WHATSAPP_TEMPLATES_APPROVED: process.env.WHATSAPP_TEMPLATES_APPROVED,
      EMAIL_FROM: process.env.EMAIL_FROM,
      EMAIL_API_KEY: process.env.EMAIL_API_KEY,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      SMTP_HOST: process.env.SMTP_HOST,
    };
    const urls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    process.env.MOCK_WHATSAPP = "0";
    process.env.MOCK_EMAIL = "1";
    process.env.WHATSAPP_TEMPLATES_APPROVED = "0";
    process.env.ALLOWED_PHONE_NUMBERS = "+910000000001";
    process.env.ALLOWED_EMAILS = "rohit@example.invalid";
    delete process.env.EMAIL_FROM;
    delete process.env.EMAIL_API_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_HOST;
    try {
      assert.equal(selectEmailTransport(), "mock");
      const sent = await fallbackToEmail(`email_mock_${Date.now()}`);
      assert.equal(sent.channel, "email");
      assert.equal(sent.status, "mock_email");
      assert.equal(sent.ok, true);
      assert.equal(urls.length, 0);
    } finally {
      globalThis.fetch = original;
      restoreEmailEnv(prev);
    }
  });

  it("posts to Resend behind the gate when a live transport is configured", async () => {
    const prev = {
      MOCK_WHATSAPP: process.env.MOCK_WHATSAPP,
      MOCK_EMAIL: process.env.MOCK_EMAIL,
      ALLOWED_PHONE_NUMBERS: process.env.ALLOWED_PHONE_NUMBERS,
      ALLOWED_EMAILS: process.env.ALLOWED_EMAILS,
      WHATSAPP_TEMPLATES_APPROVED: process.env.WHATSAPP_TEMPLATES_APPROVED,
      EMAIL_FROM: process.env.EMAIL_FROM,
      EMAIL_API_KEY: process.env.EMAIL_API_KEY,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      SMTP_HOST: process.env.SMTP_HOST,
    };
    const urls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      urls.push(String(input));
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : {};
      assert.equal(body.to[0], "rohit@example.invalid");
      assert.match(String(init?.headers && (init.headers as Record<string, string>).Authorization), /Bearer example-resend-key/);
      return new Response(JSON.stringify({ id: "re_example_1" }), { status: 200 });
    }) as typeof fetch;
    process.env.MOCK_WHATSAPP = "0";
    process.env.MOCK_EMAIL = "0";
    process.env.WHATSAPP_TEMPLATES_APPROVED = "0";
    process.env.ALLOWED_PHONE_NUMBERS = "+910000000001";
    process.env.ALLOWED_EMAILS = "rohit@example.invalid";
    process.env.EMAIL_FROM = "Saathi <noreply@example.invalid>";
    process.env.RESEND_API_KEY = "example-resend-key";
    delete process.env.SMTP_HOST;
    try {
      assert.equal(selectEmailTransport(), "resend");
      const sent = await fallbackToEmail(`email_resend_${Date.now()}`);
      assert.equal(sent.channel, "email");
      assert.equal(sent.status, "sent");
      assert.equal(sent.ok, true);
      assert.equal(urls.length, 1);
      assert.match(urls[0] ?? "", /api\.resend\.com/);
    } finally {
      globalThis.fetch = original;
      restoreEmailEnv(prev);
    }
  });

  it("picks SMTP when Resend is unset and SMTP_HOST is set", () => {
    const prev = {
      MOCK_EMAIL: process.env.MOCK_EMAIL,
      EMAIL_FROM: process.env.EMAIL_FROM,
      EMAIL_API_KEY: process.env.EMAIL_API_KEY,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      SMTP_HOST: process.env.SMTP_HOST,
    };
    process.env.MOCK_EMAIL = "0";
    process.env.EMAIL_FROM = "saathi@example.invalid";
    process.env.SMTP_HOST = "smtp.example.invalid";
    delete process.env.EMAIL_API_KEY;
    delete process.env.RESEND_API_KEY;
    try {
      assert.equal(selectEmailTransport(), "smtp");
    } finally {
      restoreEmailEnv(prev);
    }
  });

  it("shows undelivered in the ops snapshot", async () => {
    await query(
      `insert into outbound_messages (
        id, parent_id, channel, template, to_phone, body, at, status, is_example, delivery_status
      ) values ($1,'parent_kamla','email','daily_briefing_good','rohit@example.invalid','EXAMPLE',$2,'undelivered',true,'undelivered')`,
      [`out_email_undelivered_ops`, "2026-10-18T09:00:00+05:30"],
    );
    const snap = await loadOpsSnapshot();
    const row = snap.outbound.find((item) => item.gate === "undelivered" || item.delivery === "undelivered");
    assert.ok(row);
    assert.equal(row?.kind, "email");
    assert.match(row?.to ?? "", /••••@example\.invalid/);
  });
});
