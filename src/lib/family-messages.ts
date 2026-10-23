import { killSwitchOn } from "@/lib/config";
import { query } from "@/lib/db/client";
import { coerceBolnaTranscript } from "@/lib/bolna/transcript";
import { FAMILY_MESSAGE_MAX } from "@/lib/family-message-limits";
import { nowIstStamp } from "@/lib/time";

export { FAMILY_MESSAGE_MAX };

export const FAMILY_MESSAGE_HI =
  "Aaj {name} ne aapke liye ek sandesh bheja hai: '{family_message}'. Kya aap unke liye kuch kehna chahenge?";
export const FAMILY_MESSAGE_EN =
  "{name} sent you a message today: '{family_message}'. Would you like me to pass anything back?";

export type FamilyMessageRow = {
  id: string;
  parent_id: string;
  from_member_id: string | null;
  from_name: string;
  text: string;
  created_at: string;
  delivered_call_id: string | null;
  delivered_at: string | null;
  reply_to_family: string | null;
  replied_at: string | null;
  is_example: boolean;
};

export function normalizeSpoken(text: string) {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

export function validateFamilyMessageText(raw: string) {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return { ok: false as const, error: "empty" };
  if (text.length > FAMILY_MESSAGE_MAX) return { ok: false as const, error: "too_long" };
  return { ok: true as const, text };
}

export async function pendingFamilyMessage(parentId: string) {
  const rows = await query<FamilyMessageRow>(
    `select * from family_messages
      where parent_id = $1 and delivered_at is null
      order by created_at asc, id asc
      limit 1`,
    [parentId],
  );
  return rows[0] ?? null;
}

export async function latestFamilyReply(parentId: string) {
  const rows = await query<FamilyMessageRow>(
    `select * from family_messages
      where parent_id = $1 and reply_to_family is not null and trim(reply_to_family) <> ''
      order by coalesce(replied_at, created_at) desc, id desc
      limit 1`,
    [parentId],
  );
  return rows[0] ?? null;
}

/** Desk save. Not outbound — kill switch does not block this. */
export async function saveFamilyMessage(args: {
  parentId: string;
  fromMemberId?: string | null;
  fromName: string;
  text: string;
  isExample?: boolean;
}) {
  const checked = validateFamilyMessageText(args.text);
  if (!checked.ok) return checked;
  const pending = await pendingFamilyMessage(args.parentId);
  const at = nowIstStamp();
  if (pending) {
    await query(
      `update family_messages
          set from_member_id = $2, from_name = $3, text = $4, created_at = $5, is_example = $6
        where id = $1 and delivered_at is null`,
      [pending.id, args.fromMemberId ?? null, args.fromName.trim() || "family", checked.text, at, args.isExample === true],
    );
    return { ok: true as const, id: pending.id, replaced: true as const, killSwitch: killSwitchOn() };
  }
  const id = `fm_${args.parentId}_${Date.now()}`.slice(0, 80);
  await query(
    `insert into family_messages (
      id, parent_id, from_member_id, from_name, text, created_at,
      delivered_call_id, delivered_at, reply_to_family, replied_at, is_example
    ) values ($1,$2,$3,$4,$5,$6,null,null,null,null,$7)`,
    [id, args.parentId, args.fromMemberId ?? null, args.fromName.trim() || "family", checked.text, at, args.isExample === true],
  );
  return { ok: true as const, id, replaced: false as const, killSwitch: killSwitchOn() };
}

export async function familyMessageContext(parentId: string) {
  const pending = await pendingFamilyMessage(parentId);
  return {
    family_message: pending?.text ?? "",
    family_from: pending?.from_name ?? "",
    family_message_id: pending?.id ?? "",
    name: pending?.from_name ?? "",
  };
}

export async function saveFamilyReply(args: { family_message_id: string; reply: string; call_id?: string }) {
  const reply = args.reply.replace(/\s+/g, " ").trim();
  if (!reply) return { ok: false as const, error: "empty" };
  const rows = await query<FamilyMessageRow>(`select * from family_messages where id = $1`, [args.family_message_id]);
  const row = rows[0];
  if (!row) return { ok: false as const, error: "unknown_message" };
  if (row.reply_to_family && row.reply_to_family.trim()) {
    return { ok: true as const, id: row.id, replay: true as const };
  }
  await query(`update family_messages set reply_to_family = $2, replied_at = $3 where id = $1 and (reply_to_family is null or trim(reply_to_family) = '')`, [
    row.id,
    reply,
    nowIstStamp(),
  ]);
  return { ok: true as const, id: row.id, replay: false as const };
}

export async function markFamilyMessagePlayed(args: { family_message_id: string; call_id: string }) {
  const rows = await query<FamilyMessageRow>(`select * from family_messages where id = $1`, [args.family_message_id]);
  const row = rows[0];
  if (!row) return { ok: false as const, error: "unknown_message" };
  if (row.delivered_at) return { ok: true as const, id: row.id, replay: true as const };
  await query(
    `update family_messages
        set delivered_call_id = $2, delivered_at = $3
      where id = $1 and delivered_at is null`,
    [row.id, args.call_id, nowIstStamp()],
  );
  return { ok: true as const, id: row.id, replay: false as const };
}

function transcriptTurns(transcript: unknown): unknown {
  if (typeof transcript === "string") {
    const trimmed = transcript.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        return JSON.parse(trimmed) as unknown;
      } catch {
        return transcript;
      }
    }
  }
  return transcript;
}

function assistantSaidMessage(transcript: unknown, message: string) {
  const needle = normalizeSpoken(message);
  if (!needle) return false;
  const parsed = transcriptTurns(transcript);
  const raw = coerceBolnaTranscript(parsed) ?? (typeof transcript === "string" ? transcript : "");
  const lines = raw.split("\n");
  for (const line of lines) {
    const turn = line.match(/^\s*(assistant|saathi|agent)\s*:\s*(.*)$/i);
    const spoken = turn ? turn[2] : "";
    if (spoken && normalizeSpoken(spoken).includes(needle)) return true;
  }
  if (Array.isArray(parsed)) {
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const row = entry as Record<string, unknown>;
      const speaker = String(row.speaker ?? row.role ?? "");
      if (/parent|user|human/i.test(speaker)) continue;
      const text = String(row.hi ?? row.en ?? row.text ?? row.content ?? "");
      if (normalizeSpoken(text).includes(needle)) return true;
    }
  }
  return false;
}

export async function applyFamilyMessageFromWebhook(args: {
  parentId: string;
  callId: string;
  durationSec: number;
  status: string;
  transcript?: unknown;
  extractedReply?: string | null;
  toolPlayedId?: string | null;
}) {
  const pending = await pendingFamilyMessage(args.parentId);
  if (!pending) {
    if (args.extractedReply) {
      const latest = await query<FamilyMessageRow>(
        `select * from family_messages where parent_id = $1 order by created_at desc limit 1`,
        [args.parentId],
      );
      if (latest[0]) await saveFamilyReply({ family_message_id: latest[0].id, reply: args.extractedReply, call_id: args.callId });
    }
    return { pending: false as const };
  }
  const answered = args.status === "completed" && args.durationSec > 0;
  const played =
    Boolean(args.toolPlayedId && args.toolPlayedId === pending.id) || assistantSaidMessage(args.transcript, pending.text);
  if (answered && played) {
    await markFamilyMessagePlayed({ family_message_id: pending.id, call_id: args.callId });
  }
  if (args.extractedReply && answered) {
    await saveFamilyReply({ family_message_id: pending.id, reply: args.extractedReply, call_id: args.callId });
  }
  return { pending: true as const, delivered: answered && played };
}
