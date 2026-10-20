import { allowedPhones, callProviderName, dailyBudgetMinutes, isMockBolna, killSwitchOn, maxCallSeconds } from "@/lib/config";
import { buildCallContext } from "@/lib/bolna/call-context";
import { hasPilotConsent } from "@/lib/consent";
import { query } from "@/lib/db/client";
import { gateOutbound, normalizePhone } from "@/lib/outbound";
import { istDayBounds, istDayKey, minutesNowIst, nowIstStamp, parseHhMm } from "@/lib/time";

export type PlaceCallOk = {
  ok: true;
  execution_id?: string;
  mock?: boolean;
  user_data?: Awaited<ReturnType<typeof buildCallContext>>;
};
export type PlaceCallErr = { ok: false; reason: string; status?: number };
export type PlaceCallResult = PlaceCallOk | PlaceCallErr;

export type PreparedCall = {
  parentId: string;
  clock: Date;
  parentCallId?: string;
  payload: {
    agent_id: string | undefined;
    recipient_phone_number: string;
    user_data: Awaited<ReturnType<typeof buildCallContext>>;
    agent_data: { language: string };
    max_duration: number;
  };
};

/** Bolna `agent_data.language` follows the parent's first listed language. */
export function bolnaAgentLanguage(languages: string | null | undefined) {
  const first = (languages || "hi").split(",")[0]?.trim().toLowerCase();
  if (first === "en" || first === "english") return "en";
  return first || "hi";
}

export async function minutesUsedToday(clock: Date = new Date()) {
  const { start, end } = istDayBounds(istDayKey(clock));
  const rows = await query<{ secs: number }>(
    `select coalesce(sum(duration_sec),0)::int as secs from calls where started_at >= $1 and started_at < $2`,
    [start, end],
  );
  return Math.ceil((rows[0]?.secs ?? 0) / 60);
}

/** Morning dials only. Ladder retries (parent_call_id set) do not count against the cap. */
export async function dialsToday(parentId: string, clock: Date = new Date()) {
  const { start, end } = istDayBounds(istDayKey(clock));
  const rows = await query<{ n: number }>(
    `select count(*)::int as n from calls
     where parent_id = $1 and started_at >= $2 and started_at < $3
       and parent_call_id is null`,
    [parentId, start, end],
  );
  return rows[0]?.n ?? 0;
}

export function dailyDialCap() {
  return Math.max(1, Number(process.env.CALL_BUDGET_DIALS_DAILY || 1));
}

export async function prepareMorningCall(
  parentId: string,
  clock: Date = new Date(),
  opts?: { retryOf?: string; forceTest?: boolean },
): Promise<PlaceCallResult | PreparedCall> {
  if (killSwitchOn()) return { ok: false as const, reason: "kill_switch" };
  const parents = await query<{
    phone: string;
    paused: boolean;
    first_name: string;
    call_time: string;
    languages: string;
    consent_status: string;
    consent_later_count: number;
    is_example: boolean;
  }>(
    `select phone, paused, first_name, call_time, languages, consent_status, consent_later_count, is_example from parents where id = $1`,
    [parentId],
  );
  const parent = parents[0];
  if (!parent) return { ok: false as const, reason: "unknown_parent" };
  if (parent.paused) return { ok: false as const, reason: "paused" };
  if (parent.consent_status === "declined") return { ok: false as const, reason: "declined" };
  if ((parent.consent_later_count ?? 0) >= 2) return { ok: false as const, reason: "consent_later" };
  if (!isMockBolna() && !(await hasPilotConsent(parentId))) {
    return { ok: false as const, reason: "consent" };
  }
  const onAllowlist = allowedPhones().map(normalizePhone).includes(normalizePhone(parent.phone));
  if (!parent.is_example && !onAllowlist) {
    return { ok: false as const, reason: "not_allowlisted" };
  }
  const gate = gateOutbound("call", parent.phone);
  if (!gate.ok) return { ok: false as const, reason: gate.reason };
  const used = await minutesUsedToday(clock);
  if (used >= dailyBudgetMinutes()) return { ok: false as const, reason: "budget" };
  if (!opts?.retryOf && !opts?.forceTest && (await dialsToday(parentId, clock)) >= dailyDialCap()) {
    return { ok: false as const, reason: "already_called" };
  }
  if (opts?.retryOf) {
    const root = await query<{ parent_id: string; started_at: string }>(
      `select parent_id, started_at from calls where id = $1`,
      [opts.retryOf],
    );
    if (!root[0] || root[0].parent_id !== parentId) {
      return { ok: false as const, reason: "unknown_parent" };
    }
    if (!root[0].started_at.startsWith(istDayKey(clock))) {
      return { ok: false as const, reason: "already_called" };
    }
  }

  const userData = await buildCallContext(parentId);
  const payload = {
    agent_id: process.env.BOLNA_AGENT_ID,
    recipient_phone_number: gate.to,
    user_data: userData,
    agent_data: { language: bolnaAgentLanguage(parent.languages) },
    max_duration: maxCallSeconds(),
  };
  if ("from_phone_number" in payload) {
    throw new Error("Do not set from_phone_number on POST /call");
  }
  return { parentId, clock, parentCallId: opts?.retryOf, payload };
}

export function isPreparedCall(value: PlaceCallResult | PreparedCall): value is PreparedCall {
  return "payload" in value && "parentId" in value;
}

export async function recordCallPlacement(args: {
  parentId: string;
  clock: Date;
  executionId: string;
  status: "in_progress" | "failed";
  parentCallId?: string;
}) {
  const dup = await query<{ id: string }>(
    `select id from calls where id = $1 or bolna_execution_id = $1`,
    [args.executionId],
  );
  if (dup[0]) return dup[0].id;
  await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
    args.executionId,
    args.parentId,
    nowIstStamp(args.clock),
    null,
    args.status === "failed" ? 0 : null,
    args.status,
    null,
    null,
    null,
    null,
    null,
    null,
    args.executionId,
    true,
  ]);
  if (args.parentCallId) {
    await query(`update calls set parent_call_id = $1 where id = $2`, [args.parentCallId, args.executionId]);
  }
  return args.executionId;
}

export async function insertSimulatedCall(
  prepared: PreparedCall,
  parentCallId?: string,
): Promise<PlaceCallOk> {
  const executionId = `mock_${prepared.parentId}_${istDayKey(prepared.clock)}_${Date.now()}`;
  await recordCallPlacement({
    parentId: prepared.parentId,
    clock: prepared.clock,
    executionId,
    status: "in_progress",
    parentCallId,
  });
  return { ok: true as const, execution_id: executionId, mock: true, user_data: prepared.payload.user_data };
}

export type PlaceFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function postBolnaCall(
  prepared: PreparedCall,
  fetchImpl: PlaceFetch = fetch,
): Promise<PlaceCallResult> {
  const key = process.env.BOLNA_API_KEY;
  if (!key) return { ok: false as const, reason: "missing_bolna_key" };
  const res = await fetchImpl(`${process.env.BOLNA_BASE_URL || "https://api.bolna.ai"}/call`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(prepared.payload),
  });
  const body = (await res.json().catch(() => ({}))) as { execution_id?: string; id?: string; data?: { execution_id?: string; id?: string } };
  const executionId =
    body.execution_id ||
    body.id ||
    body.data?.execution_id ||
    body.data?.id ||
    `fail_${prepared.parentId}_${istDayKey(prepared.clock)}_${Date.now()}`;
  if (!res.ok) {
    await recordCallPlacement({
      parentId: prepared.parentId,
      clock: prepared.clock,
      executionId,
      status: "failed",
      parentCallId: prepared.parentCallId,
    });
    return { ok: false as const, reason: "bolna_error", status: res.status };
  }
  await recordCallPlacement({
    parentId: prepared.parentId,
    clock: prepared.clock,
    executionId,
    status: "in_progress",
    parentCallId: prepared.parentCallId,
  });
  return {
    ok: true as const,
    execution_id: executionId,
    mock: false,
    user_data: prepared.payload.user_data,
  };
}

async function recordRootRetryOutcome(rootCallId: string, clock: Date, result: string) {
  const id = `att_${rootCallId}_${result}`.slice(0, 80);
  const existing = await query<{ id: string }>(`select id from call_attempts where id = $1`, [id]);
  if (existing[0]) return;
  await query(`insert into call_attempts values ($1,$2,$3,$4,$5,$6)`, [
    id,
    rootCallId,
    nowIstStamp(clock),
    0,
    result,
    true,
  ]);
}

export async function placeRetryCall(
  parentId: string,
  clock: Date,
  parentCallId: string,
  fetchImpl: PlaceFetch = fetch,
): Promise<PlaceCallResult> {
  if (killSwitchOn()) {
    await recordRootRetryOutcome(parentCallId, clock, "kill_switch");
    return { ok: false as const, reason: "kill_switch" };
  }
  if (minutesNowIst(clock) >= 11 * 60) {
    await recordRootRetryOutcome(parentCallId, clock, "retry_skipped_window");
    return { ok: false as const, reason: "retry_skipped_window" };
  }
  const prepared = await prepareMorningCall(parentId, clock, { retryOf: parentCallId });
  if (!isPreparedCall(prepared)) {
    const reason = prepared.ok === false ? prepared.reason : "prepare_failed";
    await recordRootRetryOutcome(parentCallId, clock, reason);
    return prepared;
  }
  if (callProviderName() === "bolna") {
    const placed = await postBolnaCall(prepared, fetchImpl);
    await recordRootRetryOutcome(parentCallId, clock, placed.ok ? "retry_placed" : placed.reason);
    return placed;
  }
  const placed = await insertSimulatedCall(prepared, parentCallId);
  await recordRootRetryOutcome(parentCallId, clock, "retry_placed");
  return placed;
}
