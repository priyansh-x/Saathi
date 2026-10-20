import { bolnaBaseUrl, isMockBolna } from "@/lib/config";
import { processBolnaWebhook, type BolnaWebhook } from "@/lib/bolna/webhook";

export type BolnaExecution = BolnaWebhook & { execution_id?: string; id?: string };

export async function fetchBolnaExecution(
  executionId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<BolnaExecution | null> {
  const key = (process.env.BOLNA_API_KEY || "").trim();
  if (!key || isMockBolna()) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2000);
  let res: Response;
  try {
    res = await fetchImpl(`${bolnaBaseUrl()}/executions/${encodeURIComponent(executionId)}`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: ctrl.signal,
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) return null;
  try {
    return (await res.json()) as BolnaExecution;
  } catch {
    return null;
  }
}

export function callNeedsBolnaHydrate(call: {
  status: string;
  ended_at?: string | null;
  transcript_json?: string | null;
  duration_sec?: number | null;
}) {
  if (call.status === "in_progress" || call.status === "failed") return true;
  if (!call.ended_at) return true;
  if (call.status === "completed" && call.duration_sec == null) return true;
  if (
    (call.status === "completed" || call.status === "no_conversation") &&
    !call.transcript_json &&
    (call.duration_sec ?? 0) > 0
  ) {
    return true;
  }
  return false;
}

export async function hydrateBolnaCall(call: {
  id: string;
  status: string;
  ended_at?: string | null;
  transcript_json?: string | null;
  duration_sec?: number | null;
  bolna_execution_id?: string | null;
}) {
  if (isMockBolna() || !callNeedsBolnaHydrate(call)) return false;
  const executionId = call.bolna_execution_id || call.id;
  if (!executionId) return false;
  try {
    const payload = await fetchBolnaExecution(executionId);
    if (!payload) return false;
    const id = payload.execution_id || payload.id || executionId;
    await processBolnaWebhook(payload, id);
    return true;
  } catch {
    return false;
  }
}
