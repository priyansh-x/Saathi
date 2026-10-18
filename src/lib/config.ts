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

export function publicBaseUrl() {
  return (process.env.PUBLIC_BASE_URL || "http://127.0.0.1:43147").replace(/\/$/, "");
}

export function whatsappVerifyToken() {
  return process.env.WHATSAPP_VERIFY_TOKEN || (isMockWhatsapp() ? "dev-wa-verify" : "");
}

export function killSwitchOn() {
  return process.env.SAATHI_KILL_SWITCH === "1";
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

export function toolToken() {
  return process.env.SAATHI_TOOL_TOKEN || (isMockBolna() ? "dev-tool-token" : "");
}

export function bolnaWebhookSecret() {
  return process.env.BOLNA_WEBHOOK_SECRET || (isMockBolna() ? toolToken() : "");
}

export function cronSecret() {
  return process.env.CRON_SECRET || (isMockBolna() ? "dev-cron" : "");
}

/** Refuse live mode without real secrets. No `dev-*` fallbacks when MOCK_*=0. */
export function assertLiveSecrets() {
  if (!isMockBolna()) {
    const missing = ["BOLNA_API_KEY", "SAATHI_TOOL_TOKEN", "CRON_SECRET", "BOLNA_WEBHOOK_SECRET"].filter(
      (key) => !process.env[key],
    );
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

export function allowedEmails() {
  return (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean);
}
