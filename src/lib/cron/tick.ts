import { placeCall } from "@/lib/calls/provider";
import { isMockBolna, killSwitchOn } from "@/lib/config";
import { query } from "@/lib/db/client";
import { ensureSeed } from "@/lib/db/seed";
import { advanceLadder } from "@/lib/ladder";
import { logError } from "@/lib/log-error";
import { applyRetention } from "@/lib/retention";
import { istDayBounds, istDayKey, minutesNowIst, parseHhMm } from "@/lib/time";
import { sendSundayWeeklyNotes } from "@/lib/weekly";
import { escalateUndeliveredAlerts } from "@/lib/whatsapp/delivery";

const WINDOW_END = parseHhMm("11:00");

export function inMorningWindow(now: Date, callTime: string) {
  const mins = minutesNowIst(now);
  return mins >= parseHhMm(callTime || "08:30") && mins < WINDOW_END;
}

/** Fake clock from the cron body is mock-only. Live ticks always use wall time. */
export function resolveTickClock(
  body: { elapsed_min?: number; now?: string },
  mock = isMockBolna(),
): { now: Date; elapsedMin?: number } {
  if (!mock) return { now: new Date() };
  return {
    now: body.now ? new Date(body.now) : new Date(),
    elapsedMin: body.elapsed_min,
  };
}

export async function runDailyTick(args?: { now?: Date; elapsedMin?: number }) {
  const now = args?.now ?? new Date();
  await ensureSeed();
  const retention = await applyRetention(now);
  if (killSwitchOn()) {
    return { ok: false as const, halted: true as const, reason: "kill_switch" as const, retention };
  }
  const day = istDayKey(now);
  const { start, end } = istDayBounds(day);
  const parents = await query<{
    id: string;
    paused: boolean;
    consent_status: string;
    call_time: string;
    consent_later_count: number;
  }>(`select id, paused, consent_status, call_time, consent_later_count from parents`);
  const results = [];
  for (const parent of parents) {
    if (parent.paused) {
      results.push({ parent_id: parent.id, skipped: "paused" });
      continue;
    }
    if (parent.consent_status === "declined") {
      results.push({ parent_id: parent.id, skipped: "declined" });
      continue;
    }
    if ((parent.consent_later_count ?? 0) >= 2) {
      results.push({ parent_id: parent.id, skipped: "consent_later" });
      continue;
    }
    const open = await query<{ id: string; started_at: string; status: string }>(
      `select id, started_at, status from calls
       where parent_id = $1 and started_at >= $2 and started_at < $3 and status in ('missed','in_progress')
       order by started_at desc limit 1`,
      [parent.id, start, end],
    );
    if (open[0]) {
      const mins =
        args?.elapsedMin ??
        Math.max(0, Math.floor((now.getTime() - new Date(open[0].started_at).getTime()) / 60000));
      results.push({
        parent_id: parent.id,
        ladder: await advanceLadder({ parentId: parent.id, callId: open[0].id, elapsedMin: mins }),
      });
      continue;
    }
    const existing = await query<{ n: number }>(
      `select count(*)::int as n from calls where parent_id = $1 and started_at >= $2 and started_at < $3 and status in ('completed','no_conversation','in_progress','missed')`,
      [parent.id, start, end],
    );
    if ((existing[0]?.n ?? 0) > 0) {
      results.push({ parent_id: parent.id, skipped: "already_called" });
      continue;
    }
    if (!inMorningWindow(now, parent.call_time)) {
      results.push({ parent_id: parent.id, skipped: "outside_window" });
      continue;
    }
    try {
      results.push({ parent_id: parent.id, ...(await placeCall(parent.id, now)) });
    } catch (err) {
      await logError("cron.tick.parent", err, { parent_id: parent.id });
      results.push({ parent_id: parent.id, skipped: "error" });
    }
  }
  const weekly = await sendSundayWeeklyNotes(now);
  const waDelivery = await escalateUndeliveredAlerts(now);
  return { ok: true as const, day, results, weekly, retention, waDelivery };
}
