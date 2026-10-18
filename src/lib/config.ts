import { opsKillSwitchLatched } from "@/lib/ops/flags";

/** Product defaults. Change via env — do not hard-code elsewhere. */
export const PRODUCT_NAME = process.env.PRODUCT_NAME || "Saathi";
export const BRIEFING_CHANNEL = process.env.BRIEFING_CHANNEL || "whatsapp";
export const LANGUAGES = (process.env.LANGUAGES || "hi,en").split(",");
export const EXAMPLE_TOKEN = "example-kamla";
export const MAGIC_LINK_DAYS = 7;

/** `CALL_PROVIDER=simulated|bolna`. Default simulated. `MOCK_BOLNA=0` is an alias for bolna. */
export function callProviderName(): "simulated" | "bolna" {
  const named = (process.env.CALL_PROVIDER || "").trim().toLowerCase();
  if (named === "bolna" || named === "simulated") return named;
  return process.env.MOCK_BOLNA === "0" ? "bolna" : "simulated";
}

export function isMockBolna() {
  return callProviderName() !== "bolna";
}

export function isMockWhatsapp() {
  return (process.env.MOCK_WHATSAPP ?? "1") !== "0";
}

export function templatesApproved() {
  return process.env.WHATSAPP_TEMPLATES_APPROVED === "1";
}

/** Comma-separated Meta template names. `WHATSAPP_TEMPLATES_APPROVED=1` means all. */
export function approvedWhatsappTemplates() {
  if (templatesApproved()) return null;
  return (process.env.WHATSAPP_APPROVED_TEMPLATES || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

export function isWhatsappTemplateApproved(name: string) {
  const list = approvedWhatsappTemplates();
  if (list === null) return true;
  const base = name.replace(/_en$|_hi$/, "");
  return list.includes(name) || list.includes(base);
}

export function publicBaseUrl() {
  return (process.env.PUBLIC_BASE_URL || "http://127.0.0.1:43147").replace(/\/$/, "");
}

/** Optional HTTPS/HTTP URL of a real test-call recording. Empty keeps /demo silent. Never a local file in the repo. */
export function demoAudioUrl(raw = process.env.DEMO_AUDIO_URL) {
  const value = (raw || "").trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return value;
  } catch {
    return "";
  }
}

export function whatsappVerifyToken() {
  return process.env.WHATSAPP_VERIFY_TOKEN || (isMockWhatsapp() ? "dev-wa-verify" : "");
}

export function killSwitchOn() {
  return process.env.SAATHI_KILL_SWITCH === "1" || opsKillSwitchLatched();
}

export function voiceAlertChild() {
  return process.env.VOICE_ALERT_CHILD === "1";
}

export function defaultLadder() {
  return {
    retry_10: Number(process.env.LADDER_RETRY_10 || 10),
    retry_25: Number(process.env.LADDER_RETRY_25 || 25),
    soft_30: Number(process.env.LADDER_SOFT_30 || 30),
    last_45: Number(process.env.LADDER_LAST_45 || 45),
    escalate_60: Number(process.env.LADDER_ESCALATE_60 || 60),
  };
}

const MIN_PROD_SECRET = 32;

function prodSecret(name: string, value: string) {
  const trimmed = value.trim();
  if (process.env.NODE_ENV !== "production") return trimmed;
  if (trimmed.length < MIN_PROD_SECRET) {
    throw new Error(
      `${name} is required in production and must be at least ${MIN_PROD_SECRET} characters. Generate one with: openssl rand -hex 32`,
    );
  }
  return trimmed;
}

/** Desk session HMAC. Production: SESSION_SECRET (or MAGIC_LINK_SECRET) ≥ 32 chars. */
export function sessionSecret() {
  const fromEnv = process.env.SESSION_SECRET || process.env.MAGIC_LINK_SECRET || "";
  if (process.env.NODE_ENV === "production") return prodSecret("SESSION_SECRET", fromEnv);
  return fromEnv.trim() || "dev-magic";
}

let warnedToolTokenAlias = false;

function toolTokenFromEnv() {
  const primary = (process.env.BOLNA_TOOL_TOKEN || "").trim();
  const alias = (process.env.SAATHI_TOOL_TOKEN || "").trim();
  if (!primary && alias && !warnedToolTokenAlias) {
    warnedToolTokenAlias = true;
    console.warn("SAATHI_TOOL_TOKEN is deprecated; set BOLNA_TOOL_TOKEN instead.");
  }
  return primary || alias;
}

export function toolToken() {
  const fromEnv = toolTokenFromEnv();
  if (process.env.NODE_ENV === "production") return prodSecret("BOLNA_TOOL_TOKEN", fromEnv);
  return fromEnv || (isMockBolna() ? "dev-tool-token" : "");
}

export function bolnaWebhookSecret() {
  const fromEnv = (process.env.BOLNA_WEBHOOK_SECRET || "").trim();
  if (process.env.NODE_ENV === "production") {
    const secret = prodSecret("BOLNA_WEBHOOK_SECRET", fromEnv);
    const token = toolTokenFromEnv();
    if (token && secret === token) {
      throw new Error("BOLNA_WEBHOOK_SECRET must differ from the tool token.");
    }
    return secret;
  }
  return fromEnv;
}

export function cronSecret() {
  return process.env.CRON_SECRET || (isMockBolna() ? "dev-cron" : "");
}

/** Public hosts run NODE_ENV=production even with mocks on. No `dev-*` fallbacks. */
export function assertProductionSecrets() {
  if (process.env.NODE_ENV !== "production") return;
  const session = sessionSecret();
  const token = toolToken();
  const hook = bolnaWebhookSecret();
  if (token === hook) {
    throw new Error("BOLNA_WEBHOOK_SECRET must differ from the tool token.");
  }
  if (session.length < MIN_PROD_SECRET) {
    throw new Error("SESSION_SECRET is required in production and must be at least 32 characters.");
  }
}

/** Refuse live mode without real secrets. No `dev-*` fallbacks when MOCK_*=0. */
export function assertLiveSecrets() {
  assertProductionSecrets();
  if (!isMockBolna()) {
    const missing = ["BOLNA_API_KEY", "BOLNA_TOOL_TOKEN", "CRON_SECRET", "BOLNA_WEBHOOK_SECRET"].filter((key) => {
      if (key === "BOLNA_TOOL_TOKEN") return !toolTokenFromEnv();
      return !process.env[key];
    });
    if (missing.length) {
      throw new Error(`MOCK_BOLNA=0 requires ${missing.join(", ")}. No dev-* fallbacks.`);
    }
  }
  if (!isMockWhatsapp()) {
    const missing = ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_VERIFY_TOKEN"].filter(
      (key) => !process.env[key],
    );
    if (missing.length) {
      throw new Error(`MOCK_WHATSAPP=0 requires ${missing.join(", ")}. No dev-* fallbacks.`);
    }
  }
}

export function bolnaBaseUrl() {
  return process.env.BOLNA_BASE_URL || "https://api.bolna.ai";
}

export function dailyBudgetMinutes() {
  return Number(process.env.CALL_BUDGET_MINUTES_DAILY || 15);
}

export function maxCallSeconds() {
  return Number(process.env.MAX_CALL_SECONDS || 180);
}

export function allowedPhones() {
  return (process.env.ALLOWED_PHONE_NUMBERS || "")
    .split(",")
    .map((n) => n.replace(/\s/g, ""))
    .filter(Boolean);
}

export function retentionTranscriptDays() {
  return Number(process.env.RETENTION_TRANSCRIPT_DAYS || 30);
}

export function retentionSummaryDays() {
  return Number(process.env.RETENTION_SUMMARY_DAYS || 90);
}

export function allowedEmails() {
  return (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean);
}
