import { logMedicine, raiseAlert, saveMemoryNote } from "@/lib/bolna/tools";
import { processBolnaWebhook } from "@/lib/bolna/webhook";
import { query } from "@/lib/db/client";
import { advanceLadder } from "@/lib/ladder";
import { istDayKey, istStamp } from "@/lib/time";

export type MockScenario = "good" | "chest" | "late" | "replay" | "missed" | "skip";

export async function runMockScenario(scenario: MockScenario, parentId = "parent_kamla") {
  const executionId = `mock_${scenario}_${Date.now()}`;
  if (scenario === "good") {
    await logMedicine({
      call_sid: executionId,
      parent_id: parentId,
      medicine_name: "Amlodipine",
      status: "taken",
      said: "le li",
    });
    await saveMemoryNote({
      call_sid: executionId,
      parent_id: parentId,
      kind: "follow_up",
      note: "Asked about the terrace plants.",
    });
    return processBolnaWebhook(
      {
        id: executionId,
        status: "completed",
        conversation_duration: 140,
        transcript: "agent: namaste\nuser: Neend theek thi.",
        extracted_data: {
          medicines: [{ name: "Amlodipine", status: "taken", said: "le li" }],
          mood_quote: "Neend theek thi.",
          summary_en: "Kamla slept well and took Amlodipine.",
          summary_hi: "नींद ठीक थी, गोली ले ली।",
        },
        context_details: { recipient_data: { parent_id: parentId } },
      },
      executionId,
    );
  }

  if (scenario === "chest") {
    await logMedicine({
      call_sid: executionId,
      parent_id: parentId,
      medicine_name: "Amlodipine",
      status: "taken",
      said: "le li",
    });
    const alert = await raiseAlert({
      call_sid: executionId,
      parent_id: parentId,
      category: "EMERGENCY",
      quote: "Seene mein dard ho raha hai.",
    });
    await saveMemoryNote({
      call_sid: executionId,
      parent_id: parentId,
      kind: "follow_up",
      note: "Chest pain mentioned; family notified.",
    });
    const hook = await processBolnaWebhook(
      {
        id: executionId,
        status: "completed",
        conversation_duration: 160,
        transcript: "agent: kaisa lag raha hai\nuser: Seene mein dard ho raha hai.",
        extracted_data: {
          red_flag: { category: "EMERGENCY", quote: "Seene mein dard ho raha hai.", confidence: "high" },
          mood_quote: "Seene mein dard ho raha hai.",
          summary_en: "Kamla said she has pain in her chest.",
        },
        context_details: { recipient_data: { parent_id: parentId } },
      },
      executionId,
    );
    return { ...hook, alert_id: alert.alert_id };
  }

  if (scenario === "late") {
    return processBolnaWebhook(
      {
        id: executionId,
        status: "completed",
        conversation_duration: 120,
        transcript: "agent: hello\nuser: Bathroom mein phisal gayi.",
        extracted_data: {
          red_flag: { category: "EMERGENCY", quote: "Bathroom mein phisal gayi.", confidence: "high" },
          mood_quote: "Bathroom mein phisal gayi.",
          summary_en: "Fall mentioned; no mid-call alert tool ran.",
        },
        context_details: { recipient_data: { parent_id: parentId } },
      },
      executionId,
    );
  }

  if (scenario === "skip") {
    await logMedicine({
      call_sid: executionId,
      parent_id: parentId,
      medicine_name: "Amlodipine",
      status: "not_taken",
      said: "bhool gayi",
    });
    await saveMemoryNote({
      call_sid: executionId,
      parent_id: parentId,
      kind: "follow_up",
      note: "Forgot Amlodipine; said she would take it after the call.",
    });
    return processBolnaWebhook(
      {
        id: executionId,
        status: "completed",
        conversation_duration: 130,
        transcript: "agent: goli\nuser: Goli bhool gayi. Abhi leti hoon.",
        extracted_data: {
          medicines: [{ name: "Amlodipine", status: "not_taken", said: "bhool gayi" }],
          mood_quote: "Goli bhool gayi. Abhi leti hoon.",
          summary_en: "Kamla forgot the morning tablet and said she would take it now.",
        },
        context_details: { recipient_data: { parent_id: parentId } },
      },
      executionId,
    );
  }

  if (scenario === "missed") {
    const day = istDayKey();
    await query(`insert into calls values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
      executionId,
      parentId,
      istStamp(day, 8, 30),
      istStamp(day, 8, 31),
      0,
      "in_progress",
      "No answer.",
      "कोई नहीं उठा।",
      null,
      null,
      null,
      null,
      executionId,
      true,
    ]);
    return advanceLadder({ parentId, callId: executionId, elapsedMin: 60 });
  }

  const replayId = `mock_replay_${Date.now()}`;
  const body = {
    id: replayId,
    status: "completed" as const,
    conversation_duration: 90,
    transcript: "agent: hi\nuser: Neend theek thi.",
    extracted_data: { summary_en: "Replay fixture.", mood_quote: "Neend theek thi." },
    context_details: { recipient_data: { parent_id: parentId } },
  };
  const first = await processBolnaWebhook(body, replayId);
  const second = await processBolnaWebhook(body, replayId);
  const third = await processBolnaWebhook(body, replayId);
  return { first, second, third, execution_id: replayId };
}
