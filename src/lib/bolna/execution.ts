import { bolnaBaseUrl, isMockBolna } from "@/lib/config";
import { processBolnaWebhook, type BolnaWebhook } from "@/lib/bolna/webhook";

export type BolnaExecution = BolnaWebhook & { execution_id?: string; id?: string; data?: BolnaExecution };

const inflight = new Map<string, Promise<boolean>>();

export function bolnaExecutionId(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const row = body as Record<string, unknown>;
  if (typeof row.execution_id === "string" && row.execution_id.trim()) return row.execution_id.trim();
  if (typeof row.id === "string" && row.id.trim() && row.id !== "call") return row.id.trim();
  if (row.data && typeof row.data === "object") return bolnaExecutionId(row.data);
  return undefined;
}

export async function fetchBolnaExecution(
  executionId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<BolnaExecution | null> {
  const key = (process.env.BOLNA_API_KEY || "").trim();
  if (!key || isMockBolna()) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
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

export async function hydrateBolnaCall(
  call: {
    id: string;
    parent_id?: string | null;
    status: string;
    ended_at?: string | null;
    transcript_json?: string | null;
    duration_sec?: number | null;
    bolna_execution_id?: string | null;
  },
  fetchImpl: typeof fetch = fetch,
) {
  if (isMockBolna() || !callNeedsBolnaHydrate(call)) return false;
  const executionId = call.bolna_execution_id || call.id;
  if (!executionId) return false;
  const running = inflight.get(executionId);
  if (running) return running;
  const work = (async () => {
    try {
      const payload = await fetchBolnaExecution(executionId, fetchImpl);
      if (!payload) return false;
      const nested = payload.data && typeof payload.data === "object" ? { ...payload, ...payload.data } : payload;
      if (call.parent_id) {
        nested.context_details = {
          ...nested.context_details,
          recipient_data: {
            parent_id: call.parent_id,
            ...nested.context_details?.recipient_data,
          },
        };
      }
      await processBolnaWebhook(nested, executionId);
      return true;
    } catch {
      return false;
    }
  })().finally(() => inflight.delete(executionId));
  inflight.set(executionId, work);
  return work;
}
