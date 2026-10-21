import assert from "node:assert/strict";
import net from "node:net";
import tls from "node:tls";
import { EventEmitter } from "node:events";
import { describe, it } from "node:test";
import { sendSmtp, smtpEnvelopeFrom } from "./transport";

process.env.MOCK_EMAIL = "1";

class FakeSmtpSocket extends EventEmitter {
  readable = true;
  writable = true;
  destroyed = false;
  chunks: string[] = [];

  setEncoding() {
    return this;
  }
  write(chunk: string) {
    this.chunks.push(String(chunk));
    const text = String(chunk);
    queueMicrotask(() => {
      if (text.startsWith("EHLO")) this.emit("data", "250-HI\r\n250 AUTH PLAIN LOGIN\r\n");
      else if (text.startsWith("AUTH PLAIN")) this.emit("data", "235 ok\r\n");
      else if (text.startsWith("AUTH LOGIN")) this.emit("data", "334 VXNlcm5hbWU6\r\n");
      else if (text.startsWith("MAIL")) this.emit("data", "250 OK\r\n");
      else if (text.startsWith("RCPT")) this.emit("data", "250 OK\r\n");
      else if (text.startsWith("DATA")) this.emit("data", "354 go\r\n");
      else if (text.includes("\r\n.\r\n") || text.trim() === ".") this.emit("data", "250 queued\r\n");
      else if (text.startsWith("QUIT")) {
        this.emit("data", "221 bye\r\n");
        this.emit("end");
      }
    });
    return true;
  }
  destroy() {
    this.destroyed = true;
  }
}

describe("SMTP 465", () => {
  it("uses tls.connect from the start against a local fake server", async () => {
    const tlsCalls: unknown[] = [];
    const netCalls: unknown[] = [];
    const origTls = tls.connect;
    const origNet = net.connect;
    tls.connect = ((opts: tls.ConnectionOptions) => {
      tlsCalls.push(opts);
      const sock = new FakeSmtpSocket();
      queueMicrotask(() => sock.emit("data", "220 fake\r\n"));
      return sock as unknown as tls.TLSSocket;
    }) as typeof tls.connect;
    net.connect = ((opts: unknown) => {
      netCalls.push(opts);
      throw new Error("net.connect must not be used for port 465");
    }) as typeof net.connect;
    const prev = {
      host: process.env.SMTP_HOST,
      smtpPort: process.env.SMTP_PORT,
      from: process.env.EMAIL_FROM,
    };
    process.env.SMTP_HOST = "127.0.0.1";
    process.env.SMTP_PORT = "465";
    process.env.EMAIL_FROM = "saathi@example.invalid";
    try {
      const result = await sendSmtp({
        to: "rohit@example.invalid",
        subject: "EXAMPLE",
        text: "EXAMPLE body",
      });
      assert.equal(result.ok, true, JSON.stringify(result));
      assert.equal(tlsCalls.length, 1);
      assert.equal((tlsCalls[0] as { port?: number }).port, 465);
      assert.equal(netCalls.length, 0);
    } finally {
      tls.connect = origTls;
      net.connect = origNet;
      if (prev.host) process.env.SMTP_HOST = prev.host;
      else delete process.env.SMTP_HOST;
      if (prev.smtpPort) process.env.SMTP_PORT = prev.smtpPort;
      else delete process.env.SMTP_PORT;
      if (prev.from) process.env.EMAIL_FROM = prev.from;
      else delete process.env.EMAIL_FROM;
    }
  });

  it("authenticates on 465 and uses the address inside EMAIL_FROM", async () => {
    assert.equal(smtpEnvelopeFrom("Saathi <priyansh.joshi07@gmail.com>"), "priyansh.joshi07@gmail.com");
    const origTls = tls.connect;
    const sock = new FakeSmtpSocket();
    tls.connect = (() => {
      queueMicrotask(() => sock.emit("data", "220 fake\r\n"));
      return sock as unknown as tls.TLSSocket;
    }) as typeof tls.connect;
    try {
      const result = await sendSmtp(
        { to: "adit@gmail.com", subject: "Saathi sign-in code", text: "code" },
        {
          host: "smtp.gmail.com",
          port: 465,
          user: "priyansh.joshi07@gmail.com",
          pass: "abcdefghijklmnop",
          from: "Saathi <priyansh.joshi07@gmail.com>",
        },
      );
      assert.equal(result.ok, true, JSON.stringify(result));
      assert.equal(
        sock.chunks.some((chunk) => chunk.startsWith("AUTH PLAIN ")),
        true,
        sock.chunks.join(" | "),
      );
      assert.equal(
        sock.chunks.some((chunk) => chunk.includes("MAIL FROM:<priyansh.joshi07@gmail.com>")),
        true,
        sock.chunks.join(" | "),
      );
    } finally {
      tls.connect = origTls;
    }
  });
});
