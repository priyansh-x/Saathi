import { isLiveBolnaExecutionId } from "@/lib/bolna/execution";
import { logMedicine } from "@/lib/bolna/tools";
import { processBolnaWebhook } from "@/lib/bolna/webhook";
import { query } from "@/lib/db/client";
import { istDayKey, nowIstStamp } from "@/lib/time";

export { isLiveBolnaExecutionId };

const GOOD_TRANSCRIPT = [
  "agent: नमस्ते, मैं साथी बोल रही हूँ। कैसी नींद रही?",
  "user: Neend theek thi.",
  "agent: सुबह की गोली ले ली?",
  "user: Haan, Amlodipine le li.",
  "agent: Achha. Kal subah phir baat karte hain.",
].join("\n");

async function exampleParent(parentId: string) {
  const rows = await query<{ is_example: boolean }>(`select is_example from parents where id = $1`, [parentId]);
  return Boolean(rows[0]?.is_example);
}

async function todayCalls(parentId: string) {
  const day = istDayKey();
  return query<{
    id: string;
    status: string;
    transcript_json: string | null;
    bolna_execution_id: string | null;
  }>(
    `select id, status, transcript_json, bolna_execution_id from calls
     where parent_id = $1 and started_at like $2
     order by started_at desc`,
    [parentId, `${day}%`],
  );
}

async function deleteCallTree(callId: string) {
  const alerts = await query<{ id: string }>(`select id from alerts where call_id = $1`, [callId]);
  for (const alert of alerts) {
    await query(`delete from alert_events where alert_id = $1`, [alert.id]);
  }
  await query(`delete from alerts where call_id = $1`, [callId]);
  await query(`delete from dose_logs where call_id = $1`, [callId]);
  await query(`delete from call_attempts where call_id = $1`, [callId]);
  await query(`delete from memory_notes where call_id = $1`, [callId]);
  await query(`delete from webhook_events where execution_id = $1`, [callId]);
  await query(`delete from calls where id = $1`, [callId]);
}

/** Drop today's seed/mock rows so a finished desk call can land. Live Bolna ids stay. */
export async function wipeExampleTodayMock(parentId: string) {
  const rows = await todayCalls(parentId);
  for (const call of rows) {
    const exec = call.bolna_execution_id || call.id;
    if (isLiveBolnaExecutionId(exec)) continue;
    await deleteCallTree(call.id);
  }
  const day = istDayKey();
  await query(
    `delete from dose_logs
      where parent_id = $1 and schedule_date = $2
        and (call_id is null or call_id not in (select id from calls where parent_id = $1))`,
    [parentId, day],
  );
}

async function morningMedicineName(parentId: string) {
  const rows = await query<{ name: string }>(
    `select name from medicines where parent_id = $1 order by id limit 1`,
    [parentId],
  );
  return rows[0]?.name || "Amlodipine";
}

/** Finish a simulated ring as a completed morning with words and taken medicine. */
export async function finishSimulatedDeskCall(parentId: string, executionId?: string) {
  const id = executionId || `mock_desk_${parentId}_${istDayKey()}_${Date.now()}`;
  const medicine = await morningMedicineName(parentId);
  await logMedicine({
    call_sid: id,
    parent_id: parentId,
    medicine_name: medicine,
    status: "taken",
    said: "le li",
  });
  return processBolnaWebhook(
    {
      id,
      status: "completed",
      conversation_duration: 148,
      transcript: GOOD_TRANSCRIPT,
      extracted_data: {
        medicines: [{ name: medicine, status: "taken", said: "le li" }],
        mood_quote: "Neend theek thi.",
        summary_en: `${medicine} taken. Slept well.`,
        summary_hi: "गोली ले ली, नींद ठीक थी।",
      },
      context_details: { recipient_data: { parent_id: parentId } },
    },
    id,
  );
}

async function clearLookDoses(parentId: string) {
  const day = istDayKey();
  await query(
    `update dose_logs set status = 'taken', said = coalesce(said, 'le li')
      where parent_id = $1 and schedule_date = $2 and status = 'not_taken'`,
    [parentId, day],
  );
}

async function closeStaleMissedAlerts(parentId: string) {
  const at = nowIstStamp();
  const day = istDayKey();
  await query(
    `update alerts set resolved_at = $2, acked_at = coalesce(acked_at, $2), acked_by = coalesce(acked_by, 'Saathi')
      where parent_id = $1 and resolved_at is null and level = 'act'
        and (call_id is null or call_id not in (
          select id from calls where parent_id = $1 and started_at like $3
        ))`,
    [parentId, at, `${day}%`],
  );
}

function hasWords(transcript: string | null) {
  return Boolean(transcript && transcript.trim() && transcript.trim() !== "[]");
}

/** Call now on the EXAMPLE desk: land a finished call, keep live Bolna history. */
export async function placeExampleDeskCall(parentId: string) {
  const liveOpen = (await todayCalls(parentId)).find((call) =>
    isLiveBolnaExecutionId(call.bolna_execution_id || call.id),
  );
  if (liveOpen && liveOpen.status === "in_progress") {
    return { ok: true as const, execution_id: liveOpen.bolna_execution_id || liveOpen.id, mock: false };
  }
  await wipeExampleTodayMock(parentId);
  const result =   await finishSimulatedDeskCall(parentId);
  await clearLookDoses(parentId);
  await closeStaleMissedAlerts(parentId);
  return {
    ok: true as const,
    execution_id: "call_id" in result ? result.call_id : undefined,
    mock: true as const,
  };
}

/**
 * Opening Kamla should never stay on a mute miss / in-progress mock / missed tablet
 * when there is no live Bolna execution to hydrate.
 */
export async function ensureExampleTodayDesk(parentId: string) {
  if (!(await exampleParent(parentId))) return false;
  const rows = await todayCalls(parentId);
  const latest = rows[0];
  if (!latest) {
    await placeExampleDeskCall(parentId);
    return true;
  }
  const latestLive = isLiveBolnaExecutionId(latest.bolna_execution_id || latest.id);
  if (latestLive && latest.status === "in_progress") return false;
  if (latest.status === "completed" && hasWords(latest.transcript_json)) {
    if (!latestLive) {
      await clearLookDoses(parentId);
      await closeStaleMissedAlerts(parentId);
    }
    return !latestLive;
  }
  if (!latestLive && latest.status === "in_progress") {
    await finishSimulatedDeskCall(parentId, latest.bolna_execution_id || latest.id);
    await clearLookDoses(parentId);
    await closeStaleMissedAlerts(parentId);
    return true;
  }
  if (latestLive) return false;
  await placeExampleDeskCall(parentId);
  return true;
}
