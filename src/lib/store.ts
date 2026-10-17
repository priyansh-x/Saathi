"use client";

import { useSyncExternalStore } from "react";
import { DEMO_HOUSEHOLD } from "@/lib/demo-household";
import {
  loadCallLog,
  loadHousehold,
  loadLastCall,
  saveCall,
  saveHousehold,
} from "@/lib/storage";
import type { CallRecord, Household } from "@/lib/types";

const EVENT = "checkin-store";

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

let householdSnap: Household | null | undefined;
let lastCallSnap: CallRecord | null | undefined;
let logSnap: CallRecord[] | undefined;

function householdSnapshot() {
  const next = loadHousehold();
  if (householdSnap === next) return householdSnap;
  if (
    householdSnap &&
    next &&
    JSON.stringify(householdSnap) === JSON.stringify(next)
  ) {
    return householdSnap;
  }
  householdSnap = next;
  return householdSnap;
}

function lastCallSnapshot() {
  const next = loadLastCall();
  if (lastCallSnap && next && JSON.stringify(lastCallSnap) === JSON.stringify(next)) {
    return lastCallSnap;
  }
  lastCallSnap = next;
  return lastCallSnap;
}

function logSnapshot() {
  const next = loadCallLog();
  if (logSnap && JSON.stringify(logSnap) === JSON.stringify(next)) return logSnap;
  logSnap = next;
  return logSnap;
}

export function useHousehold() {
  return useSyncExternalStore(subscribe, householdSnapshot, () => null);
}

export function useLastCall() {
  return useSyncExternalStore(subscribe, lastCallSnapshot, () => null);
}

export function useCallLog() {
  return useSyncExternalStore(subscribe, logSnapshot, () => []);
}

export function writeHousehold(household: Household) {
  householdSnap = household;
  saveHousehold(household);
  emit();
}

export function writeCall(record: CallRecord) {
  lastCallSnap = record;
  saveCall(record);
  logSnap = undefined;
  emit();
}

export function ensureDemoHousehold() {
  const existing = loadHousehold();
  if (existing) return existing;
  writeHousehold(DEMO_HOUSEHOLD);
  return DEMO_HOUSEHOLD;
}

export function commitCall(record: CallRecord) {
  writeCall(record);
}
