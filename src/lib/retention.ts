import { retentionSummaryDays, retentionTranscriptDays } from "@/lib/config";
import { query } from "@/lib/db/client";
import { nowIstStamp } from "@/lib/time";

export function retentionCutoff(now: Date, days: number) {
  return nowIstStamp(new Date(now.getTime() - days * 86_400_000));
}

export async function applyRetention(now = new Date()) {
  const transcriptCut = retentionCutoff(now, retentionTranscriptDays());
  const summaryCut = retentionCutoff(now, retentionSummaryDays());

  const transcripts = await query<{ id: string }>(
    `update calls
     set transcript_json = null
     where started_at < $1 and transcript_json is not null
     returning id`,
    [transcriptCut],
  );

  const summaries = await query<{ id: string }>(
    `update calls
     set summary_en = null, summary_hi = null, mood_quote = null
     where started_at < $1
       and (summary_en is not null or summary_hi is not null or mood_quote is not null)
     returning id`,
    [summaryCut],
  );

  const alertQuotes = await query<{ id: string }>(
    `update alerts
     set quote = ''
     where created_at < $1 and quote <> ''
     returning id`,
    [summaryCut],
  );

  const webhookPayloads = await query<{ id: string }>(
    `update webhook_events
     set payload = '{"retained":false}'
     where at < $1 and payload is not null and payload <> '{"retained":false}'
     returning id`,
    [transcriptCut],
  );

  return {
    transcriptCut,
    summaryCut,
    transcripts: transcripts.length,
    summaries: summaries.length,
    alertQuotes: alertQuotes.length,
    webhookPayloads: webhookPayloads.length,
  };
}
