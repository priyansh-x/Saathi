import { query } from "@/lib/db/client";
import { hasRaiseAlert, logMedicine, raiseAlert } from "@/lib/bolna/tools";
import { transcriptHasParent, transcriptJson } from "@/lib/bolna/transcript";
import { advanceLadder } from "@/lib/ladder";
import { nowIstStamp } from "@/lib/time";
import type { CallRow } from "@/lib/db/types";

export type BolnaExtracted = {
  medicines?: { name?: string; status?: string; said?: string }[];
  red_flag?: { category?: string; quote?: string; confidence?: string };
  mood_quote?: string;
  summary_en?: string;
  summary_hi?: string;
  needs_human_check?: boolean;
  [key: string]: unknown;
};

export type BolnaWebhook = {
  id?: string;
  status?: string;
  conversation_duration?: number | string;
  transcript?: string;
  summary?: string;
  extracted_data?: BolnaExtracted;
  tool_call_logs?: { name?: string; category?: string }[];
  total_cost?: number | string;
  cost_breakdown?: { total_cost_to_deduct?: number | string; [key: string]: unknown };
  context_details?: { recipient_data?: { parent_id?: string; [key: string]: unknown } };
  telephony_data?: {
    recording_url?: string | null;
    hangup_reason?: string;
    hangup_by?: string;
    to_number?: string;
    from_number?: string;
    call_type?: string;
  };
};

const FAILED_STATUSES = new Set(["error", "balance-low", "canceled", "stopped", "failed"]);
const MISSED_STATUSES = new Set(["no-answer", "busy", ...FAILED_STATUSES]);

export function normalizeBolnaStatus(status?: string) {
  const raw = (status || "").trim().toLowerCase().replace(/_/g, "-");
  return raw;
}

export function isMissedBolnaStatus(status?: string) {
  return MISSED_STATUSES.has(normalizeBolnaStatus(status));
}

export function isFailedBolnaStatus(status?: string) {
  return FAILED_STATUSES.has(normalizeBolnaStatus(status));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function nestedText(data: BolnaExtracted | undefined, category: string, name: string, field: "subjective" | "objective") {
  const cat = asRecord(data?.[category]);
  const node = asRecord(cat?.[name]);
  const value = node?.[field];
  return typeof value === "string" ? value : "";
}

export function parentIdFromPayload(payload: BolnaWebhook) {
  return payload.context_details?.recipient_data?.parent_id;
}

function extractedSummaryEn(payload: BolnaWebhook) {
  const data = payload.extracted_data;
  if (typeof data?.summary_en === "string" && data.summary_en) return data.summary_en;
  if (typeof payload.summary === "string" && payload.summary) return payload.summary;
  const highlights = nestedText(data, "Family summary", "highlights", "subjective");
  return highlights || undefined;
}

function extractedMoodQuote(payload: BolnaWebhook) {
  const data = payload.extracted_data;
  if (typeof data?.mood_quote === "string" && data.mood_quote) return data.mood_quote;
  return nestedText(data, "Wellbeing", "mood", "subjective") || undefined;
}

export async function processBolnaWebhook(payload: BolnaWebhook, executionId: string) {
  const eventId = `wh_${executionId}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const at = nowIstStamp();
  if (at.endsWith("Z") || !at.includes("+05:30")) {
    throw new Error("Bolna timestamps must be IST with +05:30, never Z");
  }
  await query(`insert into webhook_events values ($1,$2,$3,$4,$5,$6)`, [
    eventId,
    "bolna",
    executionId,
    JSON.stringify(payload),
    at,
    false,
  ]);

  const already = await query<CallRow>(
    `select * from calls where bolna_execution_id = $1 or id = $1`,
    [executionId],
  );
  const incoming = normalizeBolnaStatus(payload.status);
  if (already[0]) {
    const hasCompletedData =
      already[0].status === "completed" ||
      (already[0].status === "no_conversation" && Boolean(already[0].ended_at));
    if (hasCompletedData) {
      return { ok: true as const, call_id: already[0].id, replay: true };
    }
    const reopenable = ["missed", "in_progress", "failed"].includes(already[0].status);
    if (incoming === "completed" && reopenable && !hasCompletedData) {
      // Fall through: a completed delivery is not a replay.
    } else if (already[0].status !== "in_progress") {
      return { ok: true as const, call_id: already[0].id, replay: true };
    }
  }

  const status = incoming;
  if (isMissedBolnaStatus(status)) {
    return startMissedFromWebhook(payload, executionId, eventId, already[0]);
  }
  if (status !== "completed") {
    return { ok: true as const, ignored: true as const, reason: status || "not_completed" };
  }

  const parentId = parentIdFromPayload(payload) ?? already[0]?.parent_id;
  if (!parentId) return { ok: false as const, error: "missing_parent" };

  const duration = Number(payload.conversation_duration ?? 0) || 0;
  const noConvo = duration <= 0 || !transcriptHasParent(payload.transcript);
  const callId = already[0]?.id ?? executionId;
  const started = already[0]?.started_at ?? at;
  const consent = await query<{ consent_status: string }>(`select consent_status from parents where id = $1`, [
    parentId,
  ]);
  const keepWords = consent[0]?.consent_status === "given";
  const summaryEn = keepWords
    ? noConvo
      ? "No conversation."
      : (extractedSummaryEn(payload) ?? "Morning call completed.")
    : null;
  const summaryHi = keepWords ? (noConvo ? "बात नहीं हुई।" : (typeof payload.extracted_data?.summary_hi === "string" ? payload.extracted_data.summary_hi : null)) : null;
  const quote = keepWords && !noConvo ? (extractedMoodQuote(payload) ?? null) : null;
  const transcript = keepWords && !noConvo ? transcriptJson(payload.transcript) : null;
  const recordingUrl = payload.telephony_data?.recording_url ?? null;

  if (already[0]) {
    await query(
      `update calls set ended_at=$2, duration_sec=$3, status=$4, summary_en=$5, summary_hi=$6, mood_quote=$7, mood_quote_lang=$8, transcript_json=$9, recording_url=$10, bolna_execution_id=$11
       where id = $1`,
      [
        callId,
        at,
        Math.round(duration),
        noConvo ? "no_conversation" : "completed",
        summaryEn,
        summaryHi,
        quote,
        quote ? "hi" : null,
        transcript,
        recordingUrl,
        executionId,
      ],
    );
  } else {
    await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
      callId,
      parentId,
      started,
      at,
      Math.round(duration),
      noConvo ? "no_conversation" : "completed",
      summaryEn,
      summaryHi,
      quote,
      quote ? "hi" : null,
      transcript,
      recordingUrl,
      executionId,
      true,
    ]);
  }

  if (noConvo) {
    const ladder = await advanceLadder({ parentId, callId, elapsedMin: 0, attemptResult: "no_conversation" });
    await query(`update webhook_events set processed = true where id = $1`, [eventId]);
    return { ok: true as const, call_id: callId, status: "no_conversation" as const, missed: true as const, ladder };
  }

  for (const med of payload.extracted_data?.medicines ?? []) {
    if (!med.name || !med.status) continue;
    if (med.status !== "taken" && med.status !== "not_taken" && med.status !== "not_sure") continue;
    await logMedicine({
      call_sid: callId,
      parent_id: parentId,
      medicine_name: med.name,
      status: med.status,
      said: med.said,
    });
  }

  const flag = payload.extracted_data?.red_flag;
  if (flag?.category === "EMERGENCY" || flag?.category === "URGENT") {
    const midCall = await hasRaiseAlert(callId, flag.category);
    if (!midCall) {
      await raiseAlert({
        call_sid: callId,
        parent_id: parentId,
        category: flag.category,
        quote: flag.quote || "Late extraction flag.",
        late: true,
        source: "extraction_late",
      });
    }
  }

  if (payload.extracted_data?.needs_human_check || flag?.confidence === "low") {
    await query(`insert into memory_notes values ($1,$2,$3,$4,$5,$6)`, [
      `mem_check_${callId}`,
      parentId,
      callId,
      "other",
      "needs human check",
      true,
    ]);
  }

  const { sendDailyBriefing } = await import("@/lib/whatsapp/notify");
  await sendDailyBriefing(parentId, {
    id: callId,
    mood_quote: quote,
    status: noConvo ? "no_conversation" : "completed",
  });

  await persistCallCost(callId, payload);
  await query(`update webhook_events set processed = true where id = $1`, [eventId]);
  return { ok: true as const, call_id: callId, replay: false };
}

export function bolnaTotalCost(payload: BolnaWebhook) {
  const raw = payload.total_cost ?? payload.cost_breakdown?.total_cost_to_deduct;
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

async function persistCallCost(callId: string, payload: BolnaWebhook) {
  const cost = bolnaTotalCost(payload);
  const breakdown = payload.cost_breakdown ? JSON.stringify(payload.cost_breakdown) : null;
  if (cost == null && !breakdown) return;
  await query(`update calls set total_cost = $2, cost_breakdown = $3 where id = $1`, [callId, cost, breakdown]);
}

async function startMissedFromWebhook(
  payload: BolnaWebhook,
  executionId: string,
  eventId: string,
  existing: CallRow | undefined,
) {
  const parentId = parentIdFromPayload(payload) ?? existing?.parent_id;
  if (!parentId) return { ok: false as const, error: "missing_parent" };
  const at = nowIstStamp();
  const callId = existing?.id ?? executionId;
  const status = normalizeBolnaStatus(payload.status);
  const attemptResult = status === "no-answer" ? "no_answer" : isFailedBolnaStatus(status) ? "failed" : status;
  const callStatus = isFailedBolnaStatus(status) ? "failed" : "missed";
  if (!existing) {
    await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
      callId,
      parentId,
      at,
      null,
      0,
      callStatus,
      null,
      null,
      null,
      null,
      null,
      payload.telephony_data?.recording_url ?? null,
      executionId,
      true,
    ]);
  } else if (existing.status === "in_progress") {
    await query(`update calls set status = $2, duration_sec = 0 where id = $1`, [existing.id, callStatus]);
  }
  const ladder = await advanceLadder({
    parentId,
    callId,
    elapsedMin: 0,
    attemptResult,
  });
  await persistCallCost(callId, payload);
  await query(`update webhook_events set processed = true where id = $1`, [eventId]);
  return {
    ok: true as const,
    call_id: callId,
    missed: true as const,
    replay: false as const,
    status,
    ladder,
  };
}
