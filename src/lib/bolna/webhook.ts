import { query } from "@/lib/db/client";
import { flagFromTranscript } from "@/lib/bolna/flag-from-transcript";
import { hasRaiseAlert, logMedicine, raiseAlert } from "@/lib/bolna/tools";
import { coerceBolnaTranscript, transcriptHasParent, transcriptJson, transcriptJsonHasWords } from "@/lib/bolna/transcript";
import { advanceLadder } from "@/lib/ladder";
import { nowIstStamp } from "@/lib/time";
import { last10Digits, sameIndiaMobile } from "@/lib/phone";
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
  transcript?: string | unknown;
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
  const fromContext = payload.context_details?.recipient_data?.parent_id;
  return typeof fromContext === "string" && fromContext.trim() ? fromContext.trim() : undefined;
}

function conversationSeconds(payload: BolnaWebhook) {
  const nested = payload.telephony_data as { duration?: number | string } | undefined;
  const raw = payload.conversation_duration ?? nested?.duration;
  const n = Number(raw ?? 0);
  return Number.isFinite(n) ? n : 0;
}

async function parentIdFromPhone(payload: BolnaWebhook) {
  const phone = payload.telephony_data?.to_number;
  if (!phone) return undefined;
  const tail = last10Digits(phone);
  if (tail.length < 10) return undefined;
  const parents = await query<{ id: string; phone: string; is_example: boolean }>(
    `select id, phone, is_example from parents`,
  );
  const live = parents.find((row) => !row.is_example && sameIndiaMobile(row.phone, phone));
  if (live) return live.id;
  const any = parents.find((row) => sameIndiaMobile(row.phone, phone));
  if (any) return any.id;
  const contacts = await query<{ parent_id: string; phone: string }>(`select parent_id, phone from contacts`);
  return contacts.find((row) => sameIndiaMobile(row.phone, phone))?.parent_id;
}

async function pickWebhookParent(fromContext?: string, fromPhone?: string) {
  if (fromPhone && fromContext && fromPhone !== fromContext) {
    const rows = await query<{ id: string; is_example: boolean }>(
      `select id, is_example from parents where id = $1 or id = $2`,
      [fromContext, fromPhone],
    );
    const context = rows.find((row) => row.id === fromContext);
    const phoneParent = rows.find((row) => row.id === fromPhone);
    if (context?.is_example && phoneParent && !phoneParent.is_example) return fromPhone;
    return fromPhone;
  }
  return fromContext ?? fromPhone;
}

async function existingCall(executionId: string, parentId?: string) {
  const byExec = await query<CallRow>(`select * from calls where bolna_execution_id = $1 or id = $1`, [executionId]);
  if (byExec[0]) return byExec[0];
  if (!parentId) return undefined;
  const open = await query<CallRow>(
    `select * from calls where parent_id = $1 and status = 'in_progress' order by started_at desc limit 1`,
    [parentId],
  );
  return open[0];
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
  const transcriptText = coerceBolnaTranscript(payload.transcript);
  payload = { ...payload, transcript: transcriptText };
  await query(`insert into webhook_events values ($1,$2,$3,$4,$5,$6)`, [
    eventId,
    "bolna",
    executionId,
    JSON.stringify(payload),
    at,
    false,
  ]);

  const hintedParent = await pickWebhookParent(parentIdFromPayload(payload), await parentIdFromPhone(payload));
  const alreadyRow = await existingCall(executionId, hintedParent);
  if (alreadyRow && hintedParent && alreadyRow.parent_id !== hintedParent) {
    const owners = await query<{ id: string; is_example: boolean }>(
      `select id, is_example from parents where id = $1 or id = $2`,
      [alreadyRow.parent_id, hintedParent],
    );
    const current = owners.find((row) => row.id === alreadyRow.parent_id);
    const next = owners.find((row) => row.id === hintedParent);
    if (current?.is_example && next && !next.is_example) {
      await query(`update calls set parent_id = $1 where id = $2`, [hintedParent, alreadyRow.id]);
      alreadyRow.parent_id = hintedParent;
    }
  }
  const already = alreadyRow ? [alreadyRow] : [];
  const incoming = normalizeBolnaStatus(payload.status);
  let fillingWords = false;
  if (already[0]) {
    const hasCompletedData =
      already[0].status === "completed" ||
      (already[0].status === "no_conversation" && Boolean(already[0].ended_at));
    const incomingWords = Boolean(transcriptText && (transcriptHasParent(transcriptText) || transcriptText.trim().length > 2));
    const missingWords = incomingWords && !transcriptJsonHasWords(already[0].transcript_json);
    let missingMeds = false;
    if (hasCompletedData && (payload.extracted_data?.medicines?.length ?? 0) > 0) {
      const doses = await query<{ n: number }>(
        `select count(*)::int as n from dose_logs where call_id = $1`,
        [already[0].id],
      );
      missingMeds = (doses[0]?.n ?? 0) === 0;
    }
    const incomingFlag =
      payload.extracted_data?.red_flag?.category === "EMERGENCY" ||
      payload.extracted_data?.red_flag?.category === "URGENT" ||
      flagFromTranscript(transcriptText ?? payload.transcript)?.category === "EMERGENCY";
    let missingAlert = false;
    if (hasCompletedData && incomingFlag) {
      const alerts = await query<{ n: number }>(
        `select count(*)::int as n from alerts where call_id = $1 and category in ('EMERGENCY','URGENT')`,
        [already[0].id],
      );
      missingAlert = (alerts[0]?.n ?? 0) === 0;
    }
    if (missingWords || missingMeds || missingAlert) {
      fillingWords = true;
    } else if (hasCompletedData) {
      return { ok: true as const, call_id: already[0].id, replay: true };
    } else {
      const reopenable = ["missed", "in_progress", "failed"].includes(already[0].status);
      if (incoming === "completed" && reopenable && !hasCompletedData) {
        // Fall through: a completed delivery is not a replay.
      } else if (already[0].status !== "in_progress") {
        return { ok: true as const, call_id: already[0].id, replay: true };
      }
    }
  }

  const status = incoming;
  if (isMissedBolnaStatus(status)) {
    return startMissedFromWebhook(payload, executionId, eventId, already[0]);
  }
  if (status !== "completed") {
    return { ok: true as const, ignored: true as const, reason: status || "not_completed" };
  }

  const parentId = hintedParent ?? already[0]?.parent_id;
  if (!parentId) return { ok: false as const, error: "missing_parent" };

  const duration = conversationSeconds(payload);
  const noConvo = duration <= 0 && !transcriptHasParent(transcriptText);
  const callId = already[0]?.id ?? executionId;
  const started = already[0]?.started_at ?? at;
  const consent = await query<{ consent_status: string }>(`select consent_status from parents where id = $1`, [
    parentId,
  ]);
  const keepWords = consent[0]?.consent_status !== "declined";
  const summaryEn = keepWords
    ? noConvo
      ? "No conversation."
      : (extractedSummaryEn(payload) ?? "Morning call completed.")
    : null;
  const summaryHi = keepWords ? (noConvo ? "बात नहीं हुई।" : (typeof payload.extracted_data?.summary_hi === "string" ? payload.extracted_data.summary_hi : null)) : null;
  const quote: string | null = keepWords && !noConvo ? (extractedMoodQuote(payload) ?? null) : null;
  const transcript: string | null = keepWords && !noConvo ? transcriptJson(transcriptText ?? payload.transcript) : null;
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
    if (fillingWords) {
      await persistCallCost(callId, payload);
      await query(`update webhook_events set processed = true where id = $1`, [eventId]);
      return { ok: true as const, call_id: callId, status: "no_conversation" as const, replay: false };
    }
    const ladder = await advanceLadder({ parentId, callId, elapsedMin: 0, attemptResult: "no_conversation" });
    await persistCallCost(callId, payload);
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

  const extractedFlag = payload.extracted_data?.red_flag;
  const spokenFlag = flagFromTranscript(transcriptText ?? payload.transcript);
  const flag =
    extractedFlag?.category === "EMERGENCY" || extractedFlag?.category === "URGENT"
      ? extractedFlag
      : spokenFlag
        ? { category: spokenFlag.category, quote: spokenFlag.quote, confidence: spokenFlag.confidence }
        : null;
  if (flag?.category === "EMERGENCY" || flag?.category === "URGENT") {
    const midCall = await hasRaiseAlert(callId, flag.category);
    if (!midCall) {
      await raiseAlert({
        call_sid: callId,
        parent_id: parentId,
        category: flag.category,
        quote: flag.quote || spokenFlag?.quote || "Late extraction flag.",
        late: true,
        source: extractedFlag?.category ? "extraction_late" : "transcript",
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

  if (!fillingWords) {
    const { sendDailyBriefing } = await import("@/lib/whatsapp/notify");
    await sendDailyBriefing(parentId, {
      id: callId,
      mood_quote: quote,
      status: noConvo ? "no_conversation" : "completed",
    });
  }

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
  try {
    await query(`update calls set total_cost = $2, cost_breakdown = $3 where id = $1`, [callId, cost, breakdown]);
  } catch {
    /* older databases may not have cost columns yet */
  }
}

async function startMissedFromWebhook(
  payload: BolnaWebhook,
  executionId: string,
  eventId: string,
  existing: CallRow | undefined,
) {
  const parentId = parentIdFromPayload(payload) ?? existing?.parent_id ?? (await parentIdFromPhone(payload));
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
