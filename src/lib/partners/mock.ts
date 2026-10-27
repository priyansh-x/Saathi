import { randomBytes } from "node:crypto";
import { isPartnerMock } from "@/lib/config";
import type { ErrandRow, ErrandStatus } from "@/lib/db/types";

export const MOCK_ERRAND_STEP_MS = 4000;
export const FAKE_ORDER_PREFIX = "SP-DEMO-";
export const FAKE_ORDER_PATTERN = /^SP-DEMO-[A-Z0-9]{6}$/;

const STATUS_ORDER: ErrandStatus[] = ["open", "ordered", "out_for_delivery", "delivered"];

export function fakeOrderId(bytes = randomBytes(3)) {
  return `${FAKE_ORDER_PREFIX}${bytes.toString("hex").toUpperCase()}`;
}

export function clampStrips(raw: unknown) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.min(5, Math.max(1, Math.round(n)));
}

export function mockStatusAt(orderedAtMs: number, nowMs: number): Exclude<ErrandStatus, "open"> {
  const elapsed = nowMs - orderedAtMs;
  if (elapsed >= MOCK_ERRAND_STEP_MS * 2) return "delivered";
  if (elapsed >= MOCK_ERRAND_STEP_MS) return "out_for_delivery";
  return "ordered";
}

export function mockTimeline(errand: Pick<ErrandRow, "status" | "ordered_at" | "out_for_delivery_at" | "delivered_at">) {
  return [
    { key: "ordered" as const, at: errand.ordered_at, done: STATUS_ORDER.indexOf(errand.status) >= 1 },
    { key: "out_for_delivery" as const, at: errand.out_for_delivery_at, done: STATUS_ORDER.indexOf(errand.status) >= 2 },
    { key: "delivered" as const, at: errand.delivered_at, done: STATUS_ORDER.indexOf(errand.status) >= 3 },
  ];
}

export function nextMockStatus(errand: Pick<ErrandRow, "status" | "ordered_at">, nowMs: number): ErrandStatus {
  if (!isPartnerMock()) return errand.status;
  if (!errand.ordered_at || errand.status === "open") return errand.status;
  const orderedMs = Date.parse(errand.ordered_at);
  if (!Number.isFinite(orderedMs)) return errand.status;
  return mockStatusAt(orderedMs, nowMs);
}
