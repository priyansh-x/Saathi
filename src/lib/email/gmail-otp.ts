import { sendSmtp, type EmailMessage, type EmailSendResult } from "./transport";

export const GMAIL_OTP_USER = "priyansh.joshi07@gmail.com";

export function signInOtpFrom() {
  return (process.env.EMAIL_FROM || `Saathi <${GMAIL_OTP_USER}>`).trim();
}

export function gmailApiConfigured() {
  return Boolean(
    (process.env.GMAIL_REFRESH_TOKEN || "").trim() &&
      (process.env.GMAIL_CLIENT_ID || "").trim() &&
      (process.env.GMAIL_CLIENT_SECRET || "").trim(),
  );
}

export function gmailSmtpConfigured() {
  return Boolean((process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "").trim());
}

export function signInOtpConfigured() {
  return gmailApiConfigured() || gmailSmtpConfigured();
}

export function signInOtpText(code: string) {
  return [
    `Your Saathi code is ${code}.`,
    "It lasts 10 minutes (5 tries).",
    "",
    `साथी कोड: ${code}`,
    "10 मिनट चलता है।",
  ].join("\n");
}

async function gmailAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: (process.env.GMAIL_CLIENT_ID || "").trim(),
      client_secret: (process.env.GMAIL_CLIENT_SECRET || "").trim(),
      refresh_token: (process.env.GMAIL_REFRESH_TOKEN || "").trim(),
      grant_type: "refresh_token",
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { access_token?: string };
  if (!res.ok || !body.access_token) return null;
  return body.access_token;
}

async function sendGmailApi(message: EmailMessage): Promise<EmailSendResult> {
  const token = await gmailAccessToken();
  if (!token) return { ok: false, error: "gmail_oauth" };
  const raw = Buffer.from(
    [
      `From: ${signInOtpFrom()}`,
      `To: ${message.to}`,
      `Subject: ${message.subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=utf-8",
      "",
      message.text,
    ].join("\r\n"),
  )
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) return { ok: false, error: `gmail_${res.status}` };
  const data = (await res.json().catch(() => ({}))) as { id?: string };
  return { ok: true, providerId: data.id || "gmail" };
}

export async function deliverSignInOtp(to: string, code: string): Promise<EmailSendResult> {
  const message: EmailMessage = {
    to,
    subject: "Saathi sign-in code",
    text: signInOtpText(code),
  };
  if (gmailApiConfigured()) return sendGmailApi(message);
  if (!gmailSmtpConfigured()) return { ok: false, error: "no_transport" };
  const port = Number(process.env.SMTP_PORT || 465);
  return sendSmtp(message, {
    host: (process.env.SMTP_HOST || "smtp.gmail.com").trim(),
    port: Number.isFinite(port) && port > 0 ? port : 465,
    user: (process.env.SMTP_USER || GMAIL_OTP_USER).trim(),
    pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "",
    from: signInOtpFrom(),
  });
}
