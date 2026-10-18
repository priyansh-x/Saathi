import { randomBytes } from "node:crypto";
import { query } from "@/lib/db/client";
import { nowIstStamp } from "@/lib/time";

const PHONE = /(\+?\d[\d\s-]{8,}\d)/g;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const LATIN_NAME = /\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})+\b/g;
const DEVANAGARI = /[\u0900-\u097F]{2,}/g;
const CONTEXT_OK = new Set(["parent_id", "call_id", "execution_id", "status", "code", "route", "where"]);

export function scrubPii(raw: string) {
  return raw
    .replace(PHONE, "[phone]")
    .replace(EMAIL, "[email]")
    .replace(LATIN_NAME, "[name]")
    .replace(DEVANAGARI, "[name]");
}

export function scrubContext(context: Record<string, unknown> | undefined) {
  const out: Record<string, unknown> = {};
  if (!context) return out;
  for (const [key, value] of Object.entries(context)) {
    if (!CONTEXT_OK.has(key)) continue;
    if (typeof value === "string") out[key] = scrubPii(value);
    else if (typeof value === "number" || typeof value === "boolean") out[key] = value;
  }
  return out;
}

export async function logError(where: string, err: unknown, context?: Record<string, unknown>) {
  const message = scrubPii(err instanceof Error ? err.message : String(err));
  const safeContext = scrubContext(context);
  const at = nowIstStamp();
  const row = { where, message, context: safeContext, at };
  console.error(JSON.stringify({ level: "error", ...row }));
  try {
    await query(`insert into error_events (id, where_at, message, context, at) values ($1,$2,$3,$4,$5)`, [
      `err_${randomBytes(6).toString("hex")}`,
      where,
      message.slice(0, 500),
      JSON.stringify(safeContext),
      at,
    ]);
  } catch (writeErr) {
    console.error(JSON.stringify({ level: "error", where: "logError.write", message: scrubPii(String(writeErr)), at }));
  }
}

export async function recentErrors(limit = 20) {
  return query<{ id: string; where_at: string; message: string; context: string; at: string }>(
    `select id, where_at, message, context, at from error_events order by at desc, id desc limit $1`,
    [limit],
  );
}
