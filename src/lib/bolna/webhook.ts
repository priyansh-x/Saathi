import { query } from "@/lib/db/client";
import { hasRaiseAlert, logMedicine, raiseAlert } from "@/lib/bolna/tools";
import { transcriptHasParent, transcriptJson } from "@/lib/bolna/transcript";
import { nowIstStamp } from "@/lib/time";
import type { CallRow } from "@/lib/db/types";

export type BolnaWebhook = {
  id?: string;
  status?: string;
  conversation_duration?: number;
  transcript?: string;
  extracted_data?: {
    medicines?: { name?: string; status?: string; said?: string }[];
    red_flag?: { category?: string; quote?: string; confidence?: string };
    mood_quote?: string;
    summary_en?: string;
    summary_hi?: string;
    needs_human_check?: boolean;
  };
  tool_call_logs?: { name?: string; category?: string }[];
  context_details?: { recipient_data?: { parent_id?: string } };
};

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
  if (already[0] && already[0].status !== "in_progress") {
    return { ok: true as const, call_id: already[0].id, replay: true };
  }

  if (payload.status !== "completed") {
    return { ok: true as const, ignored: true as const, reason: "not_completed" };
  }

  const parentId = payload.context_details?.recipient_data?.parent_id ?? already[0]?.parent_id;
  if (!parentId) return { ok: false as const, error: "missing_parent" };

  const duration = payload.conversation_duration ?? 0;
  const noConvo = duration <= 0 || !transcriptHasParent(payload.transcript);
  const callId = already[0]?.id ?? executionId;
  const started = already[0]?.started_at ?? at;
  const consent = await query<{ consent_status: string }>(`select consent_status from parents where id = $1`, [
    parentId,
  ]);
  const keepWords = consent[0]?.consent_status === "given";
  const summaryEn = keepWords ? (noConvo ? "No conversation." : (payload.extracted_data?.summary_en ?? "Morning call completed.")) : null;
  const summaryHi = keepWords ? (noConvo ? "बात नहीं हुई।" : (payload.extracted_data?.summary_hi ?? null)) : null;
  const quote = keepWords && !noConvo ? (payload.extracted_data?.mood_quote ?? null) : null;
  const transcript = keepWords && !noConvo ? transcriptJson(payload.transcript) : null;

  if (already[0]) {
    await query(
      `update calls set ended_at=$2, duration_sec=$3, status=$4, summary_en=$5, summary_hi=$6, mood_quote=$7, mood_quote_lang=$8, transcript_json=$9, bolna_execution_id=$10
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
      null,
      executionId,
      true,
    ]);
  }

  if (noConvo) {
    await query(`update webhook_events set processed = true where id = $1`, [eventId]);
    return { ok: true as const, call_id: callId, status: "no_conversation" as const };
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

  await query(`update webhook_events set processed = true where id = $1`, [eventId]);
  return { ok: true as const, call_id: callId, replay: false };
}
