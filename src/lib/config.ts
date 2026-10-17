/** Product defaults. Change via env — do not hard-code elsewhere. */
export const PRODUCT_NAME = process.env.PRODUCT_NAME || "Saathi";
export const BRIEFING_CHANNEL = process.env.BRIEFING_CHANNEL || "whatsapp";
export const LANGUAGES = (process.env.LANGUAGES || "hi,en").split(",");
export const EXAMPLE_TOKEN = "example-kamla";
export const MAGIC_LINK_DAYS = 7;

export function isMockBolna() {
  return (process.env.MOCK_BOLNA ?? "1") !== "0";
}

export function killSwitchOn() {
  return process.env.SAATHI_KILL_SWITCH === "1";
}

export function toolToken() {
  return process.env.SAATHI_TOOL_TOKEN || (isMockBolna() ? "dev-tool-token" : "");
}

export function cronSecret() {
  return process.env.CRON_SECRET || (isMockBolna() ? "dev-cron" : "");
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
