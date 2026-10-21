import net from "node:net";
import tls from "node:tls";
import { isMockEmail } from "@/lib/config";

export { isMockEmail };

export type EmailTransportName = "mock" | "resend" | "smtp" | "none";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export type EmailSendResult =
  | { ok: true; providerId?: string }
  | { ok: false; error: string };

export function emailFrom() {
  return (process.env.EMAIL_FROM || "").trim();
}

export function resendApiKey() {
  return (process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY || "").trim();
}

export function smtpHost() {
  return (process.env.SMTP_HOST || "").trim();
}

export function selectEmailTransport(): EmailTransportName {
  if (isMockEmail()) return "mock";
  if (emailFrom() && resendApiKey()) return "resend";
  if (emailFrom() && smtpHost()) return "smtp";
  return "none";
}

export async function deliverEmail(message: EmailMessage): Promise<EmailSendResult> {
  const kind = selectEmailTransport();
  if (kind === "mock") return { ok: true, providerId: "mock_email" };
  if (kind === "none") return { ok: false, error: "no_transport" };
  if (process.env.EMAIL_FORCE_FAIL === "1") return { ok: false, error: "forced_fail" };
  if (kind === "resend") return postResend(message);
  return sendSmtp(message);
}

async function postResend(message: EmailMessage): Promise<EmailSendResult> {
  const key = resendApiKey();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom(),
      to: [message.to],
      subject: message.subject,
      text: message.text,
    }),
  });
  if (!res.ok) return { ok: false, error: `resend_${res.status}` };
  try {
    const data = (await res.json()) as { id?: string };
    return { ok: true, providerId: data.id };
  } catch {
    return { ok: true };
  }
}

export type SmtpAuth = {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
};

function smtpPort(raw?: number) {
  const port = Number(raw ?? process.env.SMTP_PORT ?? 587);
  return Number.isFinite(port) && port > 0 ? port : 587;
}

function encodeLogin(value: string) {
  return Buffer.from(value, "utf8").toString("base64");
}

/** Implicit TLS on 465. STARTTLS on other ports. Exported for the local fake-server test. */
export async function sendSmtp(message: EmailMessage, auth: SmtpAuth = {}): Promise<EmailSendResult> {
  const host = (auth.host || smtpHost()).trim();
  const port = smtpPort(auth.port);
  const user = (auth.user ?? process.env.SMTP_USER ?? "").trim();
  const pass = auth.pass ?? process.env.SMTP_PASS ?? "";
  const from = (auth.from || emailFrom()).trim();
  const timeoutMs = 12_000;

  return new Promise((resolve) => {
    let socket: net.Socket | tls.TLSSocket | null = null;
    let buffer = "";
    let step = 0;
    let settled = false;
    const lines: string[] = [];

    const finish = (result: EmailSendResult) => {
      if (settled) return;
      settled = true;
      socket?.destroy();
      resolve(result);
    };

    const timer = setTimeout(() => finish({ ok: false, error: "smtp_timeout" }), timeoutMs);

    const write = (cmd: string) => {
      socket?.write(cmd.endsWith("\r\n") ? cmd : `${cmd}\r\n`);
    };

    const onCode = (code: number, text: string) => {
      if (step === 0 && code === 220) {
        step = 1;
        write(`EHLO saathi`);
        return;
      }
      if (step === 1 && code === 250) {
        if (port === 465) {
          step = 3;
          if (user) write(`AUTH LOGIN`);
          else {
            step = 5;
            write(`MAIL FROM:<${from}>`);
          }
          return;
        }
        step = 2;
        write("STARTTLS");
        return;
      }
      if (step === 2 && (code === 220 || code === 250)) {
        const plain = socket as net.Socket;
        const secure = tls.connect({ socket: plain, servername: host });
        socket = secure;
        buffer = "";
        step = 3;
        secure.setEncoding("utf8");
        secure.on("data", onData);
        secure.on("error", () => finish({ ok: false, error: "smtp_tls" }));
        secure.once("secureConnect", () => write(`EHLO saathi`));
        return;
      }
      if (step === 3 && code === 250) {
        if (user) {
          step = 4;
          write("AUTH LOGIN");
        } else {
          step = 5;
          write(`MAIL FROM:<${from}>`);
        }
        return;
      }
      if (step === 4) {
        if (code === 334 && /username/i.test(Buffer.from(text.replace(/^334\s+/, ""), "base64").toString("utf8") || "Username")) {
          write(encodeLogin(user));
          return;
        }
        if (code === 334) {
          if (!lines.some((line) => line.startsWith("334") && line !== text)) {
            write(encodeLogin(user));
            return;
          }
          write(encodeLogin(pass));
          return;
        }
        if (code === 235) {
          step = 5;
          write(`MAIL FROM:<${from}>`);
          return;
        }
      }
      if (step === 5 && code === 250) {
        step = 6;
        write(`RCPT TO:<${message.to}>`);
        return;
      }
      if (step === 6 && (code === 250 || code === 251)) {
        step = 7;
        write("DATA");
        return;
      }
      if (step === 7 && code === 354) {
        step = 8;
        const payload = [
          `From: ${from}`,
          `To: ${message.to}`,
          `Subject: ${message.subject}`,
          "MIME-Version: 1.0",
          "Content-Type: text/plain; charset=utf-8",
          "",
          message.text.replace(/^\./gm, ".."),
          ".",
        ].join("\r\n");
        write(payload);
        return;
      }
      if (step === 8 && code === 250) {
        write("QUIT");
        clearTimeout(timer);
        finish({ ok: true, providerId: "smtp" });
        return;
      }
      if (code >= 400) {
        clearTimeout(timer);
        finish({ ok: false, error: `smtp_${code}` });
      }
    };

    const onData = (chunk: string | Buffer) => {
      buffer += String(chunk);
      const parts = buffer.split(/\r?\n/);
      buffer = parts.pop() ?? "";
      for (const line of parts) {
        if (!line) continue;
        lines.push(line);
        const code = Number(line.slice(0, 3));
        if (line[3] === "-" || !Number.isFinite(code)) continue;
        onCode(code, line);
      }
    };

    if (port === 465) {
      socket = tls.connect({
        host,
        port,
        servername: host,
        rejectUnauthorized: process.env.SMTP_TLS_INSECURE !== "1",
      });
    } else {
      socket = net.connect({ host, port });
    }
    socket.setEncoding("utf8");
    socket.on("data", onData);
    socket.on("error", () => {
      clearTimeout(timer);
      finish({ ok: false, error: "smtp_connect" });
    });
    socket.on("end", () => {
      clearTimeout(timer);
      if (!settled) finish({ ok: false, error: "smtp_closed" });
    });
  });
}
