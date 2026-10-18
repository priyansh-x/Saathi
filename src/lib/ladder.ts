import { placeRetryCall } from "@/lib/calls/prepare";
import { placeCall } from "@/lib/calls/provider";
import { defaultLadder } from "@/lib/config";
import { query } from "@/lib/db/client";
import { raiseAlert } from "@/lib/bolna/tools";
import { formatIstClock, istStampFromOffset, istDayKey, parseHhMm } from "@/lib/time";
import { sendFamilyMessage } from "@/lib/whatsapp/send";
import { contactsFor } from "@/lib/db/queries";

export type LadderConfig = {
  retry_10: number;
  retry_25: number;
  soft_30: number;
  last_45: number;
  escalate_60: number;
};

export async function ladderConfig(parentId: string): Promise<LadderConfig> {
  const rows = await query<LadderConfig>(
    `select retry_10, retry_25, soft_30, last_45, escalate_60 from family_config where parent_id = $1`,
    [parentId],
  );
  return rows[0] ?? defaultLadder();
}

export async function ensureFamilyConfig(parentId: string) {
  const existing = await query<{ parent_id: string }>(
    `select parent_id from family_config where parent_id = $1`,
    [parentId],
  );
  if (existing[0]) return;
  const d = defaultLadder();
  await query(`insert into family_config values ($1,$2,$3,$4,$5,$6,$7,$8)`, [
    parentId,
    d.retry_10,
    d.retry_25,
    d.soft_30,
    d.last_45,
    d.escalate_60,
    false,
    true,
  ]);
}

async function recordAttempt(callId: string, offset: number, result: string) {
  const existing = await query<{ id: string }>(
    `select id from call_attempts where call_id = $1 and offset_min = $2`,
    [callId, offset],
  );
  if (existing[0]) return existing[0].id;
  const id = `att_${callId}_${offset}`;
  const parent = await query<{ call_time: string; started_at: string }>(
    `select p.call_time, c.started_at from calls c join parents p on p.id = c.parent_id where c.id = $1`,
    [callId],
  );
  const day = parent[0]?.started_at?.slice(0, 10) || istDayKey();
  const callMin = parseHhMm(parent[0]?.call_time || "08:30");
  await query(`insert into call_attempts values ($1,$2,$3,$4,$5,$6)`, [
    id,
    callId,
    istStampFromOffset(day, Math.floor(callMin / 60), callMin % 60, offset),
    offset,
    result,
    true,
  ]);
  return id;
}

function reachable(results: string[]) {
  return results.some((r) => r === "busy" || r === "declined" || r === "answered");
}

export function nextRetryLabel(callTime: string, elapsedMin: number, cfg: LadderConfig) {
  const next = [cfg.retry_10, cfg.retry_25, cfg.last_45].find((offset) => offset > elapsedMin) ?? cfg.escalate_60;
  const total = parseHhMm(callTime || "08:30") + next;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return formatIstClock(`${hh}:${mm}`);
}

type PlaceFn = (parentId: string, clock?: Date) => Promise<{ ok: boolean; reason?: string }>;

export async function advanceLadder(
  args: {
    parentId: string;
    callId: string;
    elapsedMin: number;
    attemptResult?: string;
    redial?: boolean;
    clock?: Date;
  },
  deps?: { place?: PlaceFn },
) {
  await ensureFamilyConfig(args.parentId);
  const cfg = await ladderConfig(args.parentId);
  const result = args.attemptResult ?? "no_answer";
  const steps: { offset: number; kind: "ring" | "soft" | "escalate" }[] = [
    { offset: 0, kind: "ring" },
    { offset: cfg.retry_10, kind: "ring" },
    { offset: cfg.retry_25, kind: "ring" },
    { offset: cfg.soft_30, kind: "soft" },
    { offset: cfg.last_45, kind: "ring" },
    { offset: cfg.escalate_60, kind: "escalate" },
  ];
  const ringRetries = steps.filter((step) => step.kind === "ring" && step.offset > 0);
  const parent = await query<{ first_name: string; address_term: string | null; call_time: string; phone: string }>(
    `select first_name, address_term, call_time, phone from parents where id = $1`,
    [args.parentId],
  );
  const who = parent[0]?.address_term?.trim() || parent[0]?.first_name || "family";
  const redial = args.redial ?? true;
  const clock = args.clock ?? new Date();
  const place = deps?.place;
  let placedRetry = false;

  const actions: string[] = [];
  for (const step of steps) {
    if (args.elapsedMin < step.offset) continue;
    if (step.kind === "ring") {
      const existing = await query<{ id: string }>(
        `select id from call_attempts where call_id = $1 and offset_min = $2`,
        [args.callId, step.offset],
      );
      if (!existing[0] && step.offset > 0 && redial) {
        if (placedRetry) continue;
        const already = await query<{ n: number }>(
          `select count(*)::int as n from calls where parent_call_id = $1`,
          [args.callId],
        );
        if ((already[0]?.n ?? 0) >= ringRetries.length) continue;
        const lastDial = await query<{ started_at: string }>(
          `select started_at from calls where id = $1 or parent_call_id = $1 order by started_at desc limit 1`,
          [args.callId],
        );
        const lastMs = lastDial[0] ? new Date(lastDial[0].started_at).getTime() : 0;
        let sinceLast = lastMs ? Math.floor((clock.getTime() - lastMs) / 60000) : args.elapsedMin;
        if (sinceLast < 0) sinceLast = args.elapsedMin;
        if (lastMs && sinceLast < cfg.retry_10) continue;
        const placed = place
          ? await place(args.parentId, clock)
          : await placeRetryCall(args.parentId, clock, args.callId);
        placedRetry = true;
        actions.push(placed.ok ? `redial_${step.offset}` : `redial_${step.offset}_${placed.reason || "failed"}`);
      }
      await recordAttempt(args.callId, step.offset, result);
      actions.push(`ring_${step.offset}`);
    }
    if (step.kind === "soft") {
      const already = await query<{ n: number }>(
        `select count(*)::int as n from outbound_messages where template = 'missed_call_soft' and id like $1`,
        [`%soft_${args.callId}%`],
      );
      if ((already[0]?.n ?? 0) === 0) {
        const kids = (await contactsFor(args.parentId)).filter((c) => c.role === "child");
        const tries = await query<{ n: number }>(
          `select count(*)::int as n from call_attempts where call_id = $1`,
          [args.callId],
        );
        for (const child of kids) {
          await sendFamilyMessage({
            parentId: args.parentId,
            toPhone: child.phone,
            locale: child.locale === "hi" ? "hi" : "en",
            intended: "missed_call_soft",
            vars: [
              who,
              String(tries[0]?.n || 1),
              parent[0]?.call_time || "08:30",
              nextRetryLabel(parent[0]?.call_time || "08:30", args.elapsedMin, cfg),
              parent[0]?.phone || "",
            ],
            idempotencyKey: `soft_${args.callId}_${child.phone.replace(/\s/g, "")}`,
          });
        }
      }
      actions.push("soft_notice");
    }
    if (step.kind === "escalate") {
      if (placedRetry) {
        actions.push("deferred_escalation");
        continue;
      }
      const attempts = await query<{ result: string }>(
        `select result from call_attempts where call_id = $1`,
        [args.callId],
      );
      if (reachable(attempts.map((a) => a.result))) {
        actions.push("skipped_reachable");
        continue;
      }
      const openAck = await query<{ n: number }>(
        `select count(*)::int as n from alerts where call_id = $1 and acked_at is not null`,
        [args.callId],
      );
      if ((openAck[0]?.n ?? 0) > 0) {
        actions.push("skipped_acked");
        continue;
      }
      await raiseAlert({
        call_sid: args.callId,
        parent_id: args.parentId,
        category: "MISSED",
        quote: `Couldn't reach ${who} after the morning calls.`,
        source: "ladder",
      });
      await recordAttempt(args.callId, step.offset, "escalated");
      actions.push("escalated");
    }
  }

  const terminalMissed = ["no_answer", "busy", "failed", "no_conversation"].includes(result);
  if (terminalMissed && args.attemptResult) {
    await query(
      `update calls set status = 'missed' where id = $1 and status = 'in_progress'`,
      [args.callId],
    );
  }
  return { ok: true as const, actions };
}
