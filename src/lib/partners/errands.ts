import { EXAMPLE_TOKEN, isPartnerMock, killSwitchOn } from "@/lib/config";
import { query } from "@/lib/db/client";
import type { ErrandRow, ErrandStatus } from "@/lib/db/types";
import { istDayOffset, nowIstStamp } from "@/lib/time";
import { ERRAND_FOLLOWUP_EN, ERRAND_FOLLOWUP_HI } from "@/lib/partners/copy";
import { clampStrips, fakeOrderId, MOCK_ERRAND_STEP_MS, nextMockStatus } from "@/lib/partners/mock";

function asErrand(row: ErrandRow): ErrandRow {
  return {
    ...row,
    quantity: Number(row.quantity) || 1,
    is_example: Boolean(row.is_example),
  };
}

export async function errandById(id: string) {
  const rows = await query<ErrandRow>(`select * from errands where id = $1`, [id]);
  const row = rows[0];
  return row ? asErrand(row) : null;
}

export async function errandsForParent(parentId: string) {
  const rows = await query<ErrandRow>(
    `select * from errands where parent_id = $1 order by created_at desc`,
    [parentId],
  );
  return rows.map(asErrand);
}

async function deskTokenFor(parentId: string) {
  const rows = await query<{ token: string }>(
    `select token from magic_links where parent_id = $1 order by expires_at desc limit 1`,
    [parentId],
  );
  return rows[0]?.token ?? (parentId === "parent_kamla" ? EXAMPLE_TOKEN : "");
}

export async function createRefillHandoff(input: {
  parentId: string;
  callId: string;
  medicineName: string;
  isExample?: boolean;
}) {
  if (killSwitchOn()) return { ok: false as const, reason: "kill_switch" as const };
  const medicine = input.medicineName.replace(/\s+/g, " ").trim();
  if (!medicine) return { ok: false as const, reason: "empty" as const };
  const existing = await query<ErrandRow>(
    `select * from errands where call_id = $1 and lower(medicine_name) = lower($2)`,
    [input.callId, medicine],
  );
  if (existing[0]) return { ok: true as const, errand: asErrand(existing[0]), replay: true as const };
  const id = `errand_${input.callId}_${medicine}`.replace(/\s+/g, "_").slice(0, 80);
  const token = await deskTokenFor(input.parentId);
  const at = nowIstStamp();
  await query(
    `insert into errands (
      id, parent_id, call_id, kind, medicine_name, quantity, status, partner_order_id,
      desk_token, delivery_day, ordered_at, out_for_delivery_at, delivered_at,
      told_parent_call_id, created_at, is_example
    ) values ($1,$2,$3,'refill',$4,1,'open',null,$5,$6,null,null,null,null,$7,$8)`,
    [id, input.parentId, input.callId, medicine, token, istDayOffset(1), at, input.isExample === true],
  );
  const errand = await errandById(id);
  return { ok: true as const, errand: errand!, replay: false as const };
}

export async function placeMockOrder(id: string, opts?: { quantity?: unknown; nowMs?: number }) {
  if (killSwitchOn()) return { ok: false as const, reason: "kill_switch" as const };
  const errand = await errandById(id);
  if (!errand) return { ok: false as const, reason: "missing" as const };
  const quantity = clampStrips(opts?.quantity ?? errand.quantity);
  if (errand.partner_order_id && errand.status !== "open") {
    return { ok: true as const, errand: { ...errand, quantity }, replay: true as const };
  }
  const orderId = fakeOrderId();
  const at = nowIstStamp(opts?.nowMs != null ? new Date(opts.nowMs) : new Date());
  await query(
    `update errands
        set quantity = $2, status = 'ordered', partner_order_id = $3, ordered_at = $4, delivery_day = $5
      where id = $1`,
    [id, quantity, orderId, at, istDayOffset(1)],
  );
  const updated = await errandById(id);
  return { ok: true as const, errand: updated!, replay: false as const };
}

export async function syncMockErrand(errand: ErrandRow, nowMs = Date.now()) {
  const next = nextMockStatus(errand, nowMs);
  if (next === errand.status || !isPartnerMock() || !errand.ordered_at) return errand;
  const orderedMs = Date.parse(errand.ordered_at);
  const outAt =
    errand.out_for_delivery_at ??
    (next === "out_for_delivery" || next === "delivered"
      ? nowIstStamp(new Date(orderedMs + MOCK_ERRAND_STEP_MS))
      : null);
  const deliveredAt =
    errand.delivered_at ?? (next === "delivered" ? nowIstStamp(new Date(orderedMs + MOCK_ERRAND_STEP_MS * 2)) : null);
  await query(
    `update errands
        set status = $2, out_for_delivery_at = $3, delivered_at = $4
      where id = $1`,
    [errand.id, next, outAt, deliveredAt],
  );
  return (await errandById(errand.id)) ?? { ...errand, status: next, out_for_delivery_at: outAt, delivered_at: deliveredAt };
}

export async function syncMockErrandsForParent(parentId: string, nowMs = Date.now()) {
  const rows = await errandsForParent(parentId);
  const synced: ErrandRow[] = [];
  for (const row of rows) synced.push(await syncMockErrand(row, nowMs));
  return synced;
}

export function errandStamp(rows: Pick<ErrandRow, "id" | "status" | "partner_order_id">[]) {
  return rows.map((row) => `${row.id}:${row.status}:${row.partner_order_id || ""}`).join(",");
}

export async function pendingErrandFollowup(parentId: string) {
  const rows = await query<ErrandRow>(
    `select * from errands
      where parent_id = $1 and status = 'delivered' and told_parent_call_id is null
      order by delivered_at asc, created_at asc
      limit 1`,
    [parentId],
  );
  return rows[0] ? asErrand(rows[0]) : null;
}

export function errandFollowupLine(row: ErrandRow | null) {
  if (!row) return "";
  return `${ERRAND_FOLLOWUP_HI} ${ERRAND_FOLLOWUP_EN}`;
}

export async function markErrandFollowupAsked(parentId: string, callId: string, status: string) {
  if (status !== "completed") return { updated: 0 };
  await query(
    `update errands
        set told_parent_call_id = $2
      where parent_id = $1
        and status = 'delivered'
        and told_parent_call_id is null`,
    [parentId, callId],
  );
  return { updated: 1 };
}

export function mockInFlight(rows: Pick<ErrandRow, "status">[]) {
  return rows.some((row) => row.status === "ordered" || row.status === "out_for_delivery");
}

export function isOpenErrand(status: ErrandStatus) {
  return status === "open";
}
