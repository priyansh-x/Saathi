import { placeCall } from "@/lib/calls/provider";
import { isMockBolna, killSwitchOn, maxCallSeconds } from "@/lib/config";
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

/** Fake clock from the cron body is local-mock only. Production always uses wall time. */
export function resolveTickClock(
  body: { elapsed_min?: number; now?: string },
  mock = isMockBolna(),
): { now: Date; elapsedMin?: number } {
  if (process.env.NODE_ENV === "production" || !mock) return { now: new Date() };
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
    const today = await query<{ id: string; started_at: string; status: string; parent_call_id: string | null }>(
      `select id, started_at, status, parent_call_id from calls
       where parent_id = $1 and started_at >= $2 and started_at < $3
       order by started_at desc limit 1`,
      [parent.id, start, end],
    );
    if (today[0]) {
      if (today[0].status === "in_progress") {
        const ringMs = (maxCallSeconds() + 5 * 60) * 1000;
        const startedMs = new Date(today[0].started_at).getTime();
        if (Number.isNaN(startedMs) || now.getTime() - startedMs < ringMs) {
          results.push({ parent_id: parent.id, skipped: "in_progress" });
          continue;
        }
      }
      const open = ["missed", "in_progress", "no_conversation", "failed"].includes(today[0].status);
      if (open) {
        const ladderCallId = today[0].parent_call_id || today[0].id;
        const root = await query<{ started_at: string }>(`select started_at from calls where id = $1`, [ladderCallId]);
        const mins =
          args?.elapsedMin ??
          Math.max(0, Math.floor((now.getTime() - new Date(root[0]?.started_at || today[0].started_at).getTime()) / 60000));
        results.push({
          parent_id: parent.id,
          ladder: await advanceLadder({
            parentId: parent.id,
            callId: ladderCallId,
            elapsedMin: mins,
            clock: now,
          }),
        });
        continue;
      }
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
