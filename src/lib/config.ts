/** Product defaults. Change via env — do not hard-code elsewhere. */
export const PRODUCT_NAME = process.env.PRODUCT_NAME || "Saathi";
export const BRIEFING_CHANNEL = process.env.BRIEFING_CHANNEL || "whatsapp";
export const LANGUAGES = (process.env.LANGUAGES || "hi,en").split(",");
export const EXAMPLE_TOKEN = "example-kamla";
export const MAGIC_LINK_DAYS = 7;
