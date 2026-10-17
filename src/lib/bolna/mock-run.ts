import { logMedicine, raiseAlert, saveMemoryNote } from "@/lib/bolna/tools";
import { processBolnaWebhook } from "@/lib/bolna/webhook";

export type MockScenario = "good" | "chest" | "late" | "replay";

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
