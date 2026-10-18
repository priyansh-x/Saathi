import { allowedPhones, dailyBudgetMinutes, isMockBolna, killSwitchOn, maxCallSeconds } from "@/lib/config";
import { promptVariables } from "@/lib/bolna/summary";
import { hasPilotConsent } from "@/lib/consent";
import { query } from "@/lib/db/client";
import { gateOutbound, normalizePhone } from "@/lib/outbound";
import { istDayBounds, istDayKey, istStamp, parseHhMm } from "@/lib/time";

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

export async function placeMorningCall(parentId: string, clock: Date = new Date()) {
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

  const userData = await promptVariables(parentId);
  // Omit from_phone_number so Bolna uses the account default. Never send a trailing Z.
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

  if (isMockBolna()) {
    const executionId = `mock_${parentId}_${istDayKey(clock)}_${Date.now()}`;
    const callMin = parseHhMm(parent.call_time || "08:30");
    await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
      executionId,
      parentId,
      istStamp(istDayKey(clock), Math.floor(callMin / 60), callMin % 60),
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
    return { ok: true as const, execution_id: executionId, mock: true, user_data: userData };
  }

  const key = process.env.BOLNA_API_KEY;
  if (!key) return { ok: false as const, reason: "missing_bolna_key" };
  const res = await fetch(`${process.env.BOLNA_BASE_URL || "https://api.bolna.ai"}/call`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = (await res.json().catch(() => ({}))) as { execution_id?: string; id?: string };
  if (!res.ok) return { ok: false as const, reason: "bolna_error", status: res.status };
  return { ok: true as const, execution_id: body.execution_id || body.id, mock: false, user_data: userData };
}
