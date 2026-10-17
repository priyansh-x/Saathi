const IST = "Asia/Kolkata";

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

export function istStampFromOffset(day: string, startHour: number, startMin: number, offsetMin: number) {
  const total = startHour * 60 + startMin + offsetMin;
  return istStamp(day, Math.floor(total / 60), total % 60);
}

/** Always label IST. Add the viewer's zone only when it is not IST. */
export function formatWhen(iso: string, viewerZone?: string) {
  const time = iso.includes("T") ? iso.slice(11, 16) : iso;
  const day = iso.slice(0, 10);
  const ist = `${day} ${time} IST`;
  if (!viewerZone || viewerZone === "Asia/Kolkata") return ist;
  return `${ist} · shown in ${viewerZone}`;
}

export function formatIstTime(hhmm = "08:32") {
  return `${hhmm} IST`;
}
