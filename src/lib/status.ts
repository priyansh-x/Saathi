import type { StatusLevel } from "@/lib/db/types";
import { messages, type Lang } from "@/lib/i18n/messages";
import { statusTone, type DayState } from "@/lib/today";

export function statusLabel(level: StatusLevel, lang: Lang) {
  if (level === "good") return messages[lang].good;
  if (level === "look") return messages[lang].look;
  return messages[lang].act;
}

export function statusClasses(level: StatusLevel | DayState) {
  const tone = level === "good" || level === "look" || level === "act" ? level : statusTone(level);
  if (tone === "good") return "bg-good-soft text-good";
  if (tone === "look") return "bg-amber-soft text-amber-ink";
  if (tone === "act") return "bg-alert-soft text-alert";
  return "bg-secondary text-muted-foreground";
}
