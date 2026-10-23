import type { AlertRow, AttemptRow, CallRow, DoseLog } from "@/lib/db/types";
import { messages, type Lang } from "@/lib/i18n/messages";
import { clockFromMinutes, formatClock, formatDuration, formatFriendlyTime, parseHhMm, parseIstParts } from "@/lib/time";

export type DayState = "scheduled" | "calling" | "trying" | "good" | "look" | "act" | "paused" | "skipped";

export type LadderPlan = {
  retry_10: number;
  retry_25: number;
  soft_30: number;
  last_45: number;
  escalate_60: number;
};

export type ReachStep = {
  atMin: number;
  clock: string;
  kind: "ring" | "next" | "neighbour";
  done: boolean;
  current: boolean;
  ok: boolean;
};

export function todayStatus(args: {
  paused: boolean;
  call: CallRow | null;
  doses: DoseLog[];
  actAlerts: AlertRow[];
  nowMin: number;
  callTimeMin: number;
  escalated?: boolean;
  neverCalled?: boolean;
}): DayState {
  if (args.paused) return "paused";
  const openAct = args.actAlerts.filter((a) => !a.resolved_at && a.level === "act");
  if (openAct.length > 0 || args.escalated) return "act";
  if (args.call?.status === "no_conversation") return "skipped";
  if (args.call?.status === "in_progress") return "calling";
  if (args.call?.status === "missed" || args.call?.status === "failed") {
    return "trying";
  }
  if (!args.call) {
    return "scheduled";
  }
  if (args.call.status === "completed" && args.doses.some((d) => d.status === "not_taken")) return "look";
  if (args.call.status === "completed") return "good";
  return "scheduled";
}

export function statusTone(state: DayState): "good" | "look" | "act" | "neutral" {
  if (state === "good") return "good";
  if (state === "look" || state === "trying" || state === "calling") return "look";
  if (state === "act") return "act";
  return "neutral";
}

export function dedupeDoses(doses: DoseLog[]) {
  const seen = new Map<string, DoseLog>();
  for (const dose of doses) {
    const key = dose.medicine_id || dose.name || dose.id;
    const prev = seen.get(key);
    if (!prev || (dose.id && prev.id && dose.id > prev.id)) seen.set(key, dose);
  }
  return [...seen.values()];
}

export function humanQuote(alert: AlertRow | null) {
  if (!alert) return null;
  if (alert.source === "ladder" || alert.category === "MISSED") return null;
  const q = alert.quote?.trim();
  if (!q) return null;
  if (/ladder|सीढ़ी|\bno answer after\b/i.test(q)) return null;
  return q;
}

export function categoryWords(category: string, lang: Lang) {
  const t = messages[lang];
  if (category === "EMERGENCY" || /chest|dard|seene/i.test(category)) return t.catChest;
  if (category === "FALL" || /fall|phisal/i.test(category)) return t.catFall;
  if (category === "MISSED") return t.catMissed;
  if (category === "MISSED_MED") return t.catMissedMed;
  if (category === "FALSE") return t.catFalse;
  return category.replace(/_/g, " ");
}

export function slotLabel(meal: string | undefined, lang: Lang) {
  const t = messages[lang];
  const m = (meal || "").toLowerCase();
  if (m.includes("night") || m.includes("dinner") || m.includes("रात")) return t.slotNight;
  if (m.includes("lunch") || m.includes("afternoon") || m.includes("दोपहर")) return t.slotAfternoon;
  return t.slotMorning;
}

export function doseMark(status: DoseLog["status"], lang: Lang) {
  const t = messages[lang];
  if (status === "taken") return `${t.taken} ✓`;
  if (status === "not_taken") return `${t.notTaken} –`;
  if (status === "not_sure") return `${t.notSure} ?`;
  return t.notAsked;
}

export function reachSteps(args: {
  attempts: AttemptRow[];
  plan: LadderPlan;
  callTime: string;
}): ReachStep[] {
  const start = parseHhMm(args.callTime);
  const planned = [
    { atMin: 0, kind: "ring" as const },
    { atMin: args.plan.retry_10, kind: "ring" as const },
    { atMin: args.plan.retry_25, kind: "ring" as const },
    { atMin: args.plan.last_45, kind: "ring" as const },
    { atMin: args.plan.escalate_60, kind: "neighbour" as const },
  ];
  const byOffset = new Map(args.attempts.map((a) => [a.offset_min, a]));
  let currentSet = false;
  return planned.map((p) => {
    const att = byOffset.get(p.atMin);
    const done = Boolean(att);
    const current = !done && !currentSet;
    if (current) currentSet = true;
    const clock = clockFromMinutes(start + p.atMin).label;
    return {
      atMin: p.atMin,
      clock,
      kind: current && p.kind === "ring" ? "next" : p.kind,
      done,
      current,
      ok: att?.result === "answered",
    };
  });
}

export function tryCount(attempts: AttemptRow[]) {
  return attempts.filter((a) => a.result !== "escalated").length;
}

export function answeredClock(call: CallRow | null) {
  if (!call?.started_at) return null;
  const { hh, mm } = parseIstParts(call.started_at);
  return `${formatClock(hh, mm)} IST`;
}

export function heroCopy(args: {
  state: DayState;
  lang: Lang;
  callTime: string;
  call: CallRow | null;
  doses: DoseLog[];
  alert: AlertRow | null;
  attempts: AttemptRow[];
  neighbourName: string;
  ackedBy: string | null;
  ackedAt: string | null;
  overdue?: boolean;
}): { chip: string; headline: string; sub: string } {
  const t = messages[args.lang];
  const clock = formatIstClockLabel(args.callTime);
  const tries = tryCount(args.attempts);
  const missed = args.doses.find((d) => d.status === "not_taken");

  if (args.state === "scheduled") {
    if (args.overdue && !args.call) {
      return {
        chip: t.chipLater,
        headline: t.headlineNoCallYet,
        sub: t.noCallYetHint,
      };
    }
    return {
      chip: t.chipLater,
      headline: args.lang === "hi" ? `आज की कॉल सुबह ${clock} है` : `Today's call is at ${clock}`,
      sub: args.call?.summary_en || args.call?.summary_hi || t.seeYesterdayHint,
    };
  }
  if (args.state === "good") {
    const when = answeredClock(args.call);
    const dur = formatDuration(args.call?.duration_sec);
    return {
      chip: t.good,
      headline: t.headlineGood,
      sub: [when ? (args.lang === "hi" ? `उठी ${when}` : `Picked up ${when}`) : null, dur].filter(Boolean).join(" · "),
    };
  }
  if (args.state === "look") {
    const name = missed?.name || t.tablet;
    return {
      chip: t.look,
      headline: args.lang === "hi" ? `माँ ने ${name} नहीं ली` : `Maa missed her ${name.toLowerCase().includes("sugar") ? "sugar tablet" : name}`,
      sub: answeredClock(args.call) ? `${args.lang === "hi" ? "उठी" : "Picked up"} ${answeredClock(args.call)}` : "",
    };
  }
  if (args.state === "calling") {
    return {
      chip: t.chipCalling,
      headline: t.headlineCalling,
      sub: t.callingSub,
    };
  }
  if (args.state === "trying") {
    const since = answeredClock(args.call) || clock;
    return {
      chip: t.chipTrying,
      headline:
        args.lang === "hi"
          ? `माँ से बात नहीं हो पाई: ${since} से ${tries || 1} बार कोशिश`
          : `Trying to reach Maa: ${tries || 1} ${tries === 1 ? "try" : "tries"} since ${since}`,
      sub: t.nobodyReplied,
    };
  }
  if (args.state === "act") {
    const quote = humanQuote(args.alert);
    const when = args.alert
      ? formatClock(parseIstParts(args.alert.created_at).hh, parseIstParts(args.alert.created_at).mm, args.lang)
      : "";
    const words = args.alert ? categoryWords(args.alert.category, args.lang) : t.act;
    const headline = quote
      ? args.lang === "hi"
        ? `माँ ने ${words} बताया (${when})`
        : `Maa said she has ${words} (${when})`
      : `${words}${when ? ` (${when})` : ""}`;
    let sub: string = t.nobodyReplied;
    if (args.alert?.acked_by) {
      const at = args.alert.acked_at ? formatFriendlyTime(args.alert.acked_at, args.lang) : "";
      sub = args.lang === "hi" ? `${args.alert.acked_by} जा रहे हैं (${at})` : `${args.alert.acked_by} is going (${at})`;
    }
    return { chip: t.act, headline, sub };
  }
  if (args.state === "paused") {
    return { chip: t.chipPaused, headline: t.headlinePaused, sub: "" };
  }
  return { chip: t.chipSkipped, headline: t.headlineSkipped, sub: "" };
}

function formatIstClockLabel(hhmm: string) {
  const { hour, minute } = clockFromMinutes(parseHhMm(hhmm));
  return `${formatClock(hour, minute)} IST`;
}

export function ringCopy(reason: string | undefined, lang: Lang) {
  const t = messages[lang];
  if (!reason) return null;
  if (reason === "placed") return t.ringPlaced;
  if (reason === "not_allowlisted") return t.ringNotAllowlisted;
  if (reason === "bolna_unverified") return t.ringBolnaUnverified;
  if (reason === "bolna_auth") return t.ringBolnaAuth;
  if (reason === "bolna_balance") return t.ringBolnaBalance;
  if (reason === "bolna_error") return t.ringBolnaError;
  if (reason === "bolna_hours") return t.ringBolnaHours;
  if (reason === "already_called") return t.ringAlready;
  if (reason === "paused") return t.ringPaused;
  if (reason === "example") return t.ringExample;
  if (reason === "budget") return t.ringBudget;
  if (reason === "consent") return t.ringConsent;
  if (reason === "missing_bolna_key") return t.ringBolnaAuth;
  if (reason === "kill_switch") return t.ringFail;
  if (reason === "ring_rate_limit") return t.ringWait.replace("{n}", "10");
  const wait = /^wait_(\d+)$/.exec(reason);
  if (wait) return t.ringWait.replace("{n}", wait[1]);
  return t.ringFail;
}
