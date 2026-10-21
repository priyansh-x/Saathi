import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deliverSignInOtp,
  gmailApiConfigured,
  signInOtpConfigured,
  signInOtpFrom,
  signInOtpText,
} from "./gmail-otp";

function restore(prev: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(prev)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

describe("Gmail sign-in OTP", () => {
  it("mails from priyansh.joshi07@gmail.com by default", () => {
    const prev = { EMAIL_FROM: process.env.EMAIL_FROM };
    delete process.env.EMAIL_FROM;
    try {
      assert.match(signInOtpFrom(), /priyansh\.joshi07@gmail\.com/);
      assert.match(signInOtpText("123456"), /123456/);
    } finally {
      restore(prev);
    }
  });

  it("sends the 6-digit code through the Gmail API when OAuth is set", async () => {
    const prev = {
      GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN,
      GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID,
      GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET,
      SMTP_PASS: process.env.SMTP_PASS,
    };
    process.env.GMAIL_REFRESH_TOKEN = "refresh-test";
    process.env.GMAIL_CLIENT_ID = "client-test";
    process.env.GMAIL_CLIENT_SECRET = "secret-test";
    delete process.env.SMTP_PASS;
    const urls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      urls.push(url);
      if (url.includes("oauth2.googleapis.com/token")) {
        return new Response(JSON.stringify({ access_token: "ya29.test" }), { status: 200 });
      }
      const body = JSON.parse(String(init?.body || "{}")) as { raw?: string };
      const mime = Buffer.from((body.raw || "").replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
      assert.match(mime, /To: adit@gmail.com/);
      assert.match(mime, /Your Saathi code is 654321/);
      assert.match(mime, /priyansh\.joshi07@gmail\.com/);
      return new Response(JSON.stringify({ id: "msg_1" }), { status: 200 });
    }) as typeof fetch;
    try {
      assert.equal(gmailApiConfigured(), true);
      assert.equal(signInOtpConfigured(), true);
      const sent = await deliverSignInOtp("adit@gmail.com", "654321");
      assert.equal(sent.ok, true);
      if (sent.ok) assert.equal(sent.providerId, "msg_1");
      assert.equal(urls[0], "https://oauth2.googleapis.com/token");
      assert.match(urls[1] || "", /gmail\.googleapis\.com\/gmail\/v1\/users\/me\/messages\/send/);
    } finally {
      globalThis.fetch = original;
      restore(prev);
    }
  });
});
