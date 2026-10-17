const IST = "Asia/Kolkata";

const WEEKDAY_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const WEEKDAY_HI = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"] as const;
const MONTH_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

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

export function formatClock(hour: number, minute: number) {
  const h12 = hour % 12 || 12;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h12}:${String(minute).padStart(2, "0")} ${ampm}`;
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

export function parseIstParts(iso: string) {
  const day = iso.slice(0, 10);
  const time = iso.includes("T") ? iso.slice(11, 16) : iso;
  const [y, mo, d] = day.split("-").map((n) => Number(n));
  const [hh, mm] = time.split(":").map((n) => Number(n));
  return { day, y, mo, d, hh, mm, weekday: new Date(y, mo - 1, d).getDay() };
}

export function formatFriendlyTime(iso: string, lang: "en" | "hi" = "en", viewerZone?: string) {
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
  return `${core} · shown in ${viewerZone}`;
}

export function formatHeaderDate(lang: "en" | "hi", date = new Date()) {
  const ist = istNow(date);
  const weekday = lang === "hi" ? WEEKDAY_HI[ist.getDay()] : WEEKDAY_EN[ist.getDay()];
  return `${weekday} ${ist.getDate()} ${MONTH_EN[ist.getMonth()]}`;
}

export function formatUpdated(iso: string | null | undefined, lang: "en" | "hi") {
  if (!iso) return formatFriendlyTime(istStamp(istDayKey(), istNow().getHours(), istNow().getMinutes()), lang);
  return formatFriendlyTime(iso, lang);
}

export function weekdayShort(day: string, lang: "en" | "hi") {
  const { weekday } = parseIstParts(`${day}T00:00:00+05:30`);
  return lang === "hi" ? WEEKDAY_HI[weekday] : WEEKDAY_EN[weekday];
}
