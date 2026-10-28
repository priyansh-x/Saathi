/** Family language for Meta template variables: Hindi if listed first, else English. */
export function familyTemplateLanguage(languages?: string | null): "en" | "hi" {
  const first = (languages || "").split(",")[0]?.trim().toLowerCase() || "";
  if (first === "hi" || first === "hin" || first === "hindi") return "hi";
  return "en";
}

export function emptyQuoteFallback(language: "en" | "hi") {
  return language === "hi" ? "आज कोई बात दर्ज नहीं हुई" : "no words recorded today";
}

export function quoteParam(raw: string | null | undefined, language: "en" | "hi") {
  const cleaned = String(raw ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || emptyQuoteFallback(language)).slice(0, 200);
}

const EM_DASH = "\u2014";
const EN_DASH = "\u2013";

/** WhatsApp body params must be non-empty and must not use a dash placeholder. */
export function whatsappVarsAreSafe(vars: string[]) {
  return vars.every((value) => {
    const text = String(value ?? "");
    return text.length > 0 && !text.includes(EM_DASH) && !text.includes(EN_DASH);
  });
}
