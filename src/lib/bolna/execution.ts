import { flagFromTranscript } from "@/lib/bolna/flag-from-transcript";
import { raiseAlert } from "@/lib/bolna/tools";
import { processBolnaWebhook, parentIdFromPayload, type BolnaWebhook } from "@/lib/bolna/webhook";
import { bolnaBaseUrl, callProviderName, isMockBolna } from "@/lib/config";
import { query } from "@/lib/db/client";
import { sameIndiaMobile } from "@/lib/phone";

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

function bolnaFetchEnabled() {
  if (!(process.env.BOLNA_API_KEY || "").trim()) return false;
  return callProviderName() === "bolna" || !isMockBolna();
}

export async function fetchBolnaExecution(
  executionId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<BolnaExecution | null> {
  const key = (process.env.BOLNA_API_KEY || "").trim();
  if (!key || !bolnaFetchEnabled()) return null;
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

function callHasWords(transcript?: string | null) {
  const raw = (transcript || "").trim();
  return Boolean(raw && raw !== "[]" && raw !== "null");
}

export function callNeedsBolnaHydrate(call: {
  status: string;
  ended_at?: string | null;
  transcript_json?: string | null;
  duration_sec?: number | null;
}) {
  if (call.status === "in_progress" || call.status === "failed" || call.status === "missed") return true;
  if (!call.ended_at) return true;
  if (call.status === "completed" && call.duration_sec == null) return true;
  if ((call.status === "completed" || call.status === "no_conversation") && !callHasWords(call.transcript_json)) {
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
  if (!bolnaFetchEnabled() || !callNeedsBolnaHydrate(call)) return false;
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

function executionList(body: unknown): BolnaExecution[] {
  if (Array.isArray(body)) return body as BolnaExecution[];
  if (!body || typeof body !== "object") return [];
  const row = body as Record<string, unknown>;
  if (Array.isArray(row.executions)) return row.executions as BolnaExecution[];
  if (Array.isArray(row.data)) return row.data as BolnaExecution[];
  if (Array.isArray(row.items)) return row.items as BolnaExecution[];
  return [];
}

export async function importRecentBolnaExecutions(
  parent: { id: string; phone: string },
  fetchImpl: typeof fetch = fetch,
) {
  if (!bolnaFetchEnabled()) return 0;
  const agent = (process.env.BOLNA_AGENT_ID || "").trim();
  const key = (process.env.BOLNA_API_KEY || "").trim();
  if (!agent || !key) return 0;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  let res: Response;
  try {
    res = await fetchImpl(
      `${bolnaBaseUrl()}/v2/agent/${encodeURIComponent(agent)}/executions?page_number=1&page_size=20`,
      { headers: { Authorization: `Bearer ${key}` }, signal: ctrl.signal },
    );
  } catch {
    return 0;
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) return 0;
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return 0;
  }
  let imported = 0;
  for (const row of executionList(body).slice(0, 12)) {
    const executionId = bolnaExecutionId(row);
    if (!executionId) continue;
    const full = (await fetchBolnaExecution(executionId, fetchImpl)) ?? row;
    const nested = full.data && typeof full.data === "object" ? { ...full, ...full.data } : full;
    const fromContext = parentIdFromPayload(nested);
    const toNumber = nested.telephony_data?.to_number;
    const matchesPhone = toNumber ? sameIndiaMobile(toNumber, parent.phone) : false;
    if (matchesPhone || fromContext === parent.id) {
      /* this household's line */
    } else if (fromContext && fromContext !== parent.id) {
      continue;
    } else if (toNumber && !matchesPhone) {
      continue;
    } else {
      continue;
    }
    nested.context_details = {
      ...nested.context_details,
      recipient_data: { parent_id: parent.id, ...nested.context_details?.recipient_data },
    };
    try {
      await processBolnaWebhook(nested, executionId);
      imported += 1;
    } catch {
      /* keep going */
    }
  }
  return imported;
}

export async function backfillAlertsFromTranscripts(parentId: string) {
  const rows = await query<{ id: string; parent_id: string; transcript_json: string | null }>(
    `select id, parent_id, transcript_json from calls
     where parent_id = $1 and status = 'completed'
     order by started_at desc limit 8`,
    [parentId],
  );
  let raised = 0;
  for (const call of rows) {
    const flag = flagFromTranscript(call.transcript_json);
    if (flag?.category !== "EMERGENCY") continue;
    const existing = await query<{ id: string }>(`select id from alerts where call_id = $1 and category = $2`, [
      call.id,
      flag.category,
    ]);
    if (existing[0]) continue;
    await raiseAlert({
      call_sid: call.id,
      parent_id: call.parent_id,
      category: "EMERGENCY",
      quote: flag.quote,
      late: true,
      source: "transcript",
    });
    raised += 1;
  }
  return raised;
}
