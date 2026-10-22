const IST = "Asia/Kolkata";

export const WEEKDAY_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const WEEKDAY_HI = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"] as const;
export const MONTH_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
export const MONTH_HI = ["जन", "फर", "मार्च", "अप्रै", "मई", "जून", "जुल", "अग", "सित", "अक्टू", "नव", "दिस"] as const;

export function productName() {
  return process.env.PRODUCT_NAME || "Saathi";
}

export function istNow(date = new Date()) {
  return new Date(date.toLocaleString("en-US", { timeZone: IST }));
}

export function istDayKey(date = new Date()) {
  return formatDay(istNow(date));
}

export function istDayOffset(offset: number, from = new Date()) {
  const ist = istNow(from);
  ist.setDate(ist.getDate() + offset);
  return formatDay(ist);
}

/** Inclusive start / exclusive end for an IST calendar day. */
export function istDayBounds(day: string) {
  const next = istDayOffset(1, new Date(`${day}T12:00:00+05:30`));
  return { start: `${day}T00:00:00+05:30`, end: `${next}T00:00:00+05:30` };
}

function formatDay(ist: Date) {
  const y = ist.getFullYear();
  const m = String(ist.getMonth() + 1).padStart(2, "0");
  const d = String(ist.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Clock arithmetic on IST wall time. Offsets never emit 08:90. */
export function istStamp(day: string, hour: number, minute: number) {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${day}T${hh}:${mm}:00+05:30`;
}

export function nowIstStamp(date = new Date()) {
  const ist = istNow(date);
  return istStamp(istDayKey(date), ist.getHours(), ist.getMinutes());
}

export function istStampFromOffset(day: string, startHour: number, startMin: number, offsetMin: number) {
  const total = startHour * 60 + startMin + offsetMin;
  return istStamp(day, Math.floor(total / 60), total % 60);
}

export function parseHhMm(hhmm: string) {
  const [h, m] = hhmm.split(":").map((n) => Number(n));
  return (h || 0) * 60 + (m || 0);
}

export function minutesNowIst(date = new Date()) {
  const ist = istNow(date);
  return ist.getHours() * 60 + ist.getMinutes();
}

export function clockFromMinutes(total: number) {
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return { hour: h, minute: m, label: formatClock(h, m) };
}

export function formatClock(hour: number, minute: number, lang: "en" | "hi" = "en") {
  const h12 = hour % 12 || 12;
  const mm = String(minute).padStart(2, "0");
  if (lang === "hi") {
    const part = hour < 4 ? "रात" : hour < 12 ? "सुबह" : hour < 16 ? "दोपहर" : hour < 20 ? "शाम" : "रात";
    return `${part} ${h12}:${mm}`;
  }
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h12}:${mm}\u00a0${ampm}`;
}

export function formatIstClock(hhmm = "08:32") {
  const mins = parseHhMm(hhmm);
  const { hour, minute } = clockFromMinutes(mins);
  return `${formatClock(hour, minute)} IST`;
}

/** @deprecated use formatFriendlyTime — kept for non-Today screens until PR D */
export function formatWhen(iso: string, viewerZone?: string) {
  return formatFriendlyTime(iso, "en", viewerZone);
}

export function formatIstTime(hhmm = "08:32") {
  return formatIstClock(hhmm);
}

export function formatDuration(sec: number | null | undefined) {
  if (sec == null || sec <= 0) return null;
  const mins = Math.max(1, Math.round(sec / 60));
  return `${mins} min`;
}

function formatIstOffset(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const grab = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "00";
  return `${grab("year")}-${grab("month")}-${grab("day")}T${grab("hour")}:${grab("minute")}:${grab("second")}+05:30`;
}

export function toIsoString(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return formatIstOffset(value);
  return String(value);
}

export function parseIstParts(iso: unknown) {
  const text = toIsoString(iso);
  const day = text.slice(0, 10) || "1970-01-01";
  const time = text.includes("T") ? text.slice(11, 16) : text;
  const [y, mo, d] = day.split("-").map((n) => Number(n));
  const [hh, mm] = time.split(":").map((n) => Number(n));
  return { day, y, mo, d, hh, mm, weekday: new Date(y, mo - 1, d).getDay() };
}

export function formatFriendlyTime(iso: unknown, lang: "en" | "hi" = "en", viewerZone?: string) {
  const { day, mo, d, hh, mm, weekday } = parseIstParts(iso);
  const today = istDayKey();
  const clock = `${formatClock(hh, mm)} IST`;
  const weekdayLabel = lang === "hi" ? WEEKDAY_HI[weekday] : WEEKDAY_EN[weekday];
  const core =
    day === today
      ? lang === "hi"
        ? `आज ${clock}`
        : `Today ${clock}`
      : `${weekdayLabel} ${d} ${MONTH_EN[mo - 1]}, ${clock}`;
  if (!viewerZone || viewerZone === IST) return core;
  const view = new Date(`${toIsoString(iso).replace(" ", "T")}`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: viewerZone,
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).formatToParts(Number.isNaN(view.getTime()) ? new Date() : view);
  const viewHour = parts.find((p) => p.type === "hour")?.value;
  const viewMin = parts.find((p) => p.type === "minute")?.value;
  const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value;
  const tz = parts.find((p) => p.type === "timeZoneName")?.value || viewerZone;
  const wd = parts.find((p) => p.type === "weekday")?.value;
  return `${core} · ${viewHour}:${viewMin} ${dayPeriod} ${tz} (${wd})`;
}

export function formatHeaderDate(lang: "en" | "hi", date = new Date()) {
  const ist = istNow(date);
  const weekday = lang === "hi" ? WEEKDAY_HI[ist.getDay()] : WEEKDAY_EN[ist.getDay()];
  return `${weekday} ${ist.getDate()} ${MONTH_EN[ist.getMonth()]}`;
}

export function formatUpdated(iso: unknown, lang: "en" | "hi") {
  const text = toIsoString(iso);
  if (!text) return formatFriendlyTime(istStamp(istDayKey(), istNow().getHours(), istNow().getMinutes()), lang);
  return formatFriendlyTime(text, lang);
}

export function weekdayShort(day: string, lang: "en" | "hi") {
  const { weekday } = parseIstParts(`${day}T00:00:00+05:30`);
  return lang === "hi" ? WEEKDAY_HI[weekday] : WEEKDAY_EN[weekday];
}

/** Monday (inclusive) of the IST week containing `date`. Weeks are Mon–Sun. */
export function istWeekMonday(date = new Date()) {
  const ist = istNow(date);
  const back = ist.getDay() === 0 ? 6 : ist.getDay() - 1;
  ist.setDate(ist.getDate() - back);
  return formatDay(ist);
}

export function istWeekSunday(date = new Date()) {
  return istDayOffset(6, new Date(`${istWeekMonday(date)}T12:00:00+05:30`));
}

export function istWeekDays(date = new Date()) {
  const monday = istWeekMonday(date);
  return Array.from({ length: 7 }, (_, i) => istDayOffset(i, new Date(`${monday}T12:00:00+05:30`)));
}

export function formatWeekRange(monday: string, sunday: string) {
  const a = parseIstParts(`${monday}T12:00:00+05:30`);
  const b = parseIstParts(`${sunday}T12:00:00+05:30`);
  if (a.mo === b.mo) return `${a.d}–${b.d} ${MONTH_EN[a.mo - 1]}`;
  return `${a.d} ${MONTH_EN[a.mo - 1]}–${b.d} ${MONTH_EN[b.mo - 1]}`;
}

/** Sunday from 18:00 IST until midnight. */
export function inSundayEveningWindow(date = new Date()) {
  return istNow(date).getDay() === 0 && minutesNowIst(date) >= 18 * 60;
}

export function formatCallHeader(
  iso: unknown,
  durationSec: number | null | undefined,
  languageLabel: string,
  lang: "en" | "hi" = "en",
) {
  const { mo, d, hh, mm, weekday } = parseIstParts(iso);
  const weekdayLabel = lang === "hi" ? WEEKDAY_HI[weekday] : WEEKDAY_EN[weekday];
  const clock = `${formatClock(hh, mm)} IST`;
  const dur = formatDuration(durationSec);
  const date = `${weekdayLabel} ${d} ${MONTH_EN[mo - 1]}`;
  return [date, clock, dur, languageLabel].filter(Boolean).join(" · ");
}
