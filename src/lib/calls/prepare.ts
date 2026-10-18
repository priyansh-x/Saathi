import { allowedPhones, dailyBudgetMinutes, isMockBolna, killSwitchOn, maxCallSeconds } from "@/lib/config";
import { buildCallContext } from "@/lib/bolna/call-context";
import { hasPilotConsent } from "@/lib/consent";
import { query } from "@/lib/db/client";
import { gateOutbound, normalizePhone } from "@/lib/outbound";
import { istDayBounds, istDayKey, istStamp, parseHhMm } from "@/lib/time";

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

export async function prepareMorningCall(parentId: string, clock: Date = new Date()): Promise<PlaceCallResult | PreparedCall> {
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
  const used = await minutesUsedToday(clock);
  if (used >= dailyBudgetMinutes()) return { ok: false as const, reason: "budget" };
  const onAllowlist = allowedPhones().map(normalizePhone).includes(normalizePhone(parent.phone));
  if (!parent.is_example && !onAllowlist) {
    return { ok: false as const, reason: "not_allowlisted" };
  }
  const gate = gateOutbound("call", parent.phone);
  if (!gate.ok) return { ok: false as const, reason: gate.reason };

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
  return { parentId, clock, payload };
}

export function isPreparedCall(value: PlaceCallResult | PreparedCall): value is PreparedCall {
  return "payload" in value && "parentId" in value;
}

export async function insertSimulatedCall(prepared: PreparedCall): Promise<PlaceCallOk> {
  const executionId = `mock_${prepared.parentId}_${istDayKey(prepared.clock)}_${Date.now()}`;
  const parents = await query<{ call_time: string }>(`select call_time from parents where id = $1`, [
    prepared.parentId,
  ]);
  const callMin = parseHhMm(parents[0]?.call_time || "08:30");
  await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
    executionId,
    prepared.parentId,
    istStamp(istDayKey(prepared.clock), Math.floor(callMin / 60), callMin % 60),
    null,
    null,
    "in_progress",
    null,
    null,
    null,
    null,
    null,
    null,
    executionId,
    true,
  ]);
  return { ok: true as const, execution_id: executionId, mock: true, user_data: prepared.payload.user_data };
}

export async function postBolnaCall(prepared: PreparedCall): Promise<PlaceCallResult> {
  const key = process.env.BOLNA_API_KEY;
  if (!key) return { ok: false as const, reason: "missing_bolna_key" };
  const res = await fetch(`${process.env.BOLNA_BASE_URL || "https://api.bolna.ai"}/call`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(prepared.payload),
  });
  const body = (await res.json().catch(() => ({}))) as { execution_id?: string; id?: string };
  if (!res.ok) return { ok: false as const, reason: "bolna_error", status: res.status };
  return {
    ok: true as const,
    execution_id: body.execution_id || body.id,
    mock: false,
    user_data: prepared.payload.user_data,
  };
}
