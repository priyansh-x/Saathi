import { istDayKey, istDayOffset } from "@/lib/time";

export type PilotCallInput = {
  started_at: string;
  status: string;
  duration_sec: number | null;
};

export type PilotAlertInput = {
  falseResolved: boolean;
};

export type PilotViewInput = {
  at: string;
};

export type PilotHouseholdMetrics = {
  parentId: string;
  name: string;
  daysEnrolled: number;
  dials: number;
  answered: number;
  answerRate: number;
  medianCallSeconds: number | null;
  answeredDays: number;
  answeredStreak: number;
  deskViewsPerDay: number;
  alertsRaised: number;
  alertsResolvedFalse: number;
};

export function isAnsweredCall(call: PilotCallInput) {
  return call.status === "completed" && Number(call.duration_sec ?? 0) > 0;
}

function dayOf(stamp: string) {
  return stamp.slice(0, 10);
}

export function daysBetweenInclusive(fromDay: string, toDay: string) {
  if (!fromDay || fromDay > toDay) return 0;
  let n = 0;
  let d = fromDay;
  while (d <= toDay && n < 4000) {
    n += 1;
    d = istDayOffset(1, new Date(`${d}T12:00:00+05:30`));
  }
  return n;
}

export function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? null;
  return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

export function consecutiveAnsweredStreak(answeredDays: Set<string>, today: string) {
  let streak = 0;
  let d = today;
  while (answeredDays.has(d) && streak < 4000) {
    streak += 1;
    d = istDayOffset(-1, new Date(`${d}T12:00:00+05:30`));
  }
  return streak;
}

export function computePilotMetrics(args: {
  parentId: string;
  name: string;
  now: Date;
  consentAt: string | null;
  calls: PilotCallInput[];
  alerts: PilotAlertInput[];
  views: PilotViewInput[];
}): PilotHouseholdMetrics {
  const today = istDayKey(args.now);
  const consentDay = args.consentAt ? dayOf(args.consentAt) : today;
  const daysEnrolled = Math.max(1, daysBetweenInclusive(consentDay, today));
  const dials = args.calls.length;
  const answeredCalls = args.calls.filter(isAnsweredCall);
  const answered = answeredCalls.length;
  const answerRate = dials ? answered / dials : 0;
  const medianCallSeconds = median(answeredCalls.map((c) => Number(c.duration_sec ?? 0)));
  const answeredDaySet = new Set(answeredCalls.map((c) => dayOf(c.started_at)));
  const answeredDays = answeredDaySet.size;
  const answeredStreak = consecutiveAnsweredStreak(answeredDaySet, today);
  const deskViewsPerDay = args.views.length / daysEnrolled;
  return {
    parentId: args.parentId,
    name: args.name,
    daysEnrolled,
    dials,
    answered,
    answerRate,
    medianCallSeconds,
    answeredDays,
    answeredStreak,
    deskViewsPerDay,
    alertsRaised: args.alerts.length,
    alertsResolvedFalse: args.alerts.filter((a) => a.falseResolved).length,
  };
}

export function totalPilotRow(rows: PilotHouseholdMetrics[]): PilotHouseholdMetrics {
  const daysEnrolled = rows.reduce((s, r) => s + r.daysEnrolled, 0);
  const dials = rows.reduce((s, r) => s + r.dials, 0);
  const answered = rows.reduce((s, r) => s + r.answered, 0);
  const views = rows.reduce((s, r) => s + r.deskViewsPerDay * r.daysEnrolled, 0);
  const medians = rows.flatMap((r) => (r.medianCallSeconds == null ? [] : [r.medianCallSeconds]));
  return {
    parentId: "totals",
    name: "Totals",
    daysEnrolled,
    dials,
    answered,
    answerRate: dials ? answered / dials : 0,
    medianCallSeconds: median(medians),
    answeredDays: rows.reduce((s, r) => s + r.answeredDays, 0),
    answeredStreak: rows.reduce((s, r) => Math.max(s, r.answeredStreak), 0),
    deskViewsPerDay: daysEnrolled ? views / daysEnrolled : 0,
    alertsRaised: rows.reduce((s, r) => s + r.alertsRaised, 0),
    alertsResolvedFalse: rows.reduce((s, r) => s + r.alertsResolvedFalse, 0),
  };
}

export function pilotCsv(rows: PilotHouseholdMetrics[]) {
  const header = [
    "parent_id",
    "name",
    "days_enrolled",
    "dials",
    "answered",
    "answer_rate",
    "median_call_seconds",
    "answered_days",
    "answered_streak",
    "desk_views_per_day",
    "alerts_raised",
    "alerts_resolved_false",
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.parentId,
        csvCell(row.name),
        row.daysEnrolled,
        row.dials,
        row.answered,
        row.answerRate.toFixed(3),
        row.medianCallSeconds ?? "",
        row.answeredDays,
        row.answeredStreak,
        row.deskViewsPerDay.toFixed(3),
        row.alertsRaised,
        row.alertsResolvedFalse,
      ].join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}
