import type { StatusLevel } from "@/lib/db/types";

export function statusLabel(level: StatusLevel, lang: "en" | "hi") {
  if (level === "good") return lang === "hi" ? "ठीक" : "Good";
  if (level === "look") return lang === "hi" ? "एक नज़र" : "Needs a look";
  return lang === "hi" ? "अभी देखें" : "Act now";
}

export function statusClasses(level: StatusLevel) {
  if (level === "good") return "bg-good-soft text-good";
  if (level === "look") return "bg-amber-soft text-amber-ink";
  return "bg-alert-soft text-alert";
}
