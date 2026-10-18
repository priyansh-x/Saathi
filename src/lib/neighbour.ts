import { query } from "@/lib/db/client";
import { nowIstStamp } from "@/lib/time";
import { sendFamilyMessage } from "@/lib/whatsapp/send";

export async function neighbourOptedIn(parentId: string) {
  const rows = await query<{ granted: boolean }>(
    `select granted from consents where parent_id = $1 and kind = 'neighbour_whatsapp' order by at desc limit 1`,
    [parentId],
  );
  return rows[0]?.granted === true;
}

export async function requestNeighbourOptIn(parentId: string) {
  const parent = await query<{ first_name: string; city: string }>(
    `select first_name, city from parents where id = $1`,
    [parentId],
  );
  const neighbour = await query<{ phone: string; locale: string; first_name: string }>(
    `select phone, locale, first_name from contacts where parent_id = $1 and role = 'neighbour' limit 1`,
    [parentId],
  );
  const child = await query<{ first_name: string }>(
    `select first_name from contacts where parent_id = $1 and role = 'child' order by is_owner desc limit 1`,
    [parentId],
  );
  if (!parent[0] || !neighbour[0]) return { ok: false as const, reason: "missing_neighbour" };
  await query(`delete from consents where parent_id = $1 and kind = 'neighbour_whatsapp'`, [parentId]);
  const locale = neighbour[0].locale === "hi" ? "hi" : "en";
  return sendFamilyMessage({
    parentId,
    toPhone: neighbour[0].phone,
    locale,
    intended: "responder_optin",
    vars: [neighbour[0].first_name, child[0]?.first_name ?? "family", parent[0].first_name, parent[0].city],
    idempotencyKey: `optin_${parentId}_${neighbour[0].phone.replace(/\s/g, "")}`,
  });
}

export async function recordNeighbourReply(parentId: string, yes: boolean) {
  await query(`delete from consents where parent_id = $1 and kind = 'neighbour_whatsapp'`, [parentId]);
  await query(`insert into consents values ($1,$2,$3,$4,$5,$6,$7)`, [
    `con_neighbour_${parentId}`,
    parentId,
    "neighbour_whatsapp",
    yes,
    nowIstStamp(),
    yes ? "whatsapp_yes" : "whatsapp_no",
    false,
  ]);
  return { ok: true as const, granted: yes };
}

export function parseNeighbourIntent(text: string, payload: string) {
  const raw = `${payload} ${text}`.toLowerCase();
  if (/\bneighbour_yes\b|\byes\b|\bhaan\b|\bहां\b|\bहाँ\b/.test(raw)) return "yes" as const;
  if (/\bneighbour_no\b|\bno\b|\bnahi\b|\bnahīn\b|\bनहीं\b/.test(raw)) return "no" as const;
  return null;
}
