"use client";

import type { CallRecord, Household } from "@/lib/types";
import {
  STORAGE_CALL_LOG,
  STORAGE_HOUSEHOLD,
  STORAGE_LAST_CALL,
} from "@/lib/types";

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadHousehold(): Household | null {
  return readJson<Household>(STORAGE_HOUSEHOLD);
}

export function saveHousehold(household: Household) {
  window.localStorage.setItem(STORAGE_HOUSEHOLD, JSON.stringify(household));
}

export function loadLastCall(): CallRecord | null {
  return readJson<CallRecord>(STORAGE_LAST_CALL);
}

export function loadCallLog(): CallRecord[] {
  return readJson<CallRecord[]>(STORAGE_CALL_LOG) ?? [];
}

export function saveCall(record: CallRecord) {
  window.localStorage.setItem(STORAGE_LAST_CALL, JSON.stringify(record));
  const log = loadCallLog().filter((item) => item.endedAt !== record.endedAt);
  log.unshift(record);
  window.localStorage.setItem(STORAGE_CALL_LOG, JSON.stringify(log.slice(0, 21)));
}

export function clearCalls() {
  window.localStorage.removeItem(STORAGE_LAST_CALL);
  window.localStorage.removeItem(STORAGE_CALL_LOG);
}
