import type { AlertEvent, AlertRow } from "@/lib/db/types";
import { messages, type Lang } from "@/lib/i18n/messages";
import { categoryWords, humanQuote } from "@/lib/today";
import { formatClock, formatFriendlyTime, parseIstParts } from "@/lib/time";

export type AlertLife = "open" | "going" | "ok" | "false";

export function alertLife(alert: AlertRow): AlertLife {
  if (alert.is_false || alert.source === "false_alarm") return "false";
  if (alert.resolved_at) return "ok";
  if (alert.acked_at) return "going";
  return "open";
}

export function sortAlerts(alerts: AlertRow[]) {
  return [...alerts].sort((a, b) => {
    const ao = a.resolved_at ? 1 : 0;
    const bo = b.resolved_at ? 1 : 0;
    if (ao !== bo) return ao - bo;
    return b.created_at.localeCompare(a.created_at);
  });
}

export function severityChip(alert: AlertRow, lang: Lang) {
  const t = messages[lang];
  if (alertLife(alert) === "ok" || alertLife(alert) === "false") return null;
  if (alert.level === "act") return { label: t.act, tone: "act" as const };
  return { label: t.checkIn, tone: "look" as const };
}

export function statusPill(alert: AlertRow, lang: Lang) {
  const t = messages[lang];
  const life = alertLife(alert);
  if (life === "false") return { label: t.falseAlarm, tone: "neutral" as const };
  if (life === "ok") {
    const who = alert.acked_by || t.maa;
    const when = alert.resolved_at ? shortClock(alert.resolved_at) : "";
    return { label: `${t.maaOkPill} · ${who} ${when}`.trim(), tone: "good" as const };
  }
  if (life === "going") {
    const when = alert.acked_at ? shortClock(alert.acked_at) : "";
    return { label: `${alert.acked_by} ${t.isGoing} · ${when}`.trim(), tone: "look" as const };
  }
  return { label: t.open, tone: "open" as const };
}

export function alertTitle(alert: AlertRow, lang: Lang) {
  return categoryWords(alert.category, lang);
}

export function alertQuoteLine(alert: AlertRow) {
  return humanQuote(alert);
}

export function eventLine(event: AlertEvent, lang: Lang) {
  const t = messages[lang];
  const when = formatFriendlyTime(event.at, lang);
  if (event.kind === "notified") {
    return `${when} ${t.told} ${event.note || event.actor || ""}`.trim();
  }
  if (event.kind === "acked") {
    return `${when} ${event.actor}: ${t.imOnIt}`;
  }
  if (event.kind === "false_alarm") {
    return `${when} ${event.actor}: ${t.falseAlarm}`;
  }
  if (event.kind === "resolved") {
    return `${when} ${event.actor}: ${t.shesOk}`;
  }
  return `${when} ${event.actor ?? ""} ${event.note ?? ""}`.trim();
}

function shortClock(iso: string) {
  const { hh, mm } = parseIstParts(iso);
  return formatClock(hh, mm);
}
