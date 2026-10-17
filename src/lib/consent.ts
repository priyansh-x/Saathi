import { query } from "@/lib/db/client";
import { nowIst } from "@/lib/bolna/tools";

export async function consentsFor(parentId: string) {
  return query<{ kind: string; granted: boolean; at: string; evidence: string | null }>(
    `select kind, granted, at, evidence from consents where parent_id = $1`,
    [parentId],
  );
}

export async function hasPilotConsent(parentId: string) {
  const rows = await consentsFor(parentId);
  const child = rows.some((r) => r.kind === "child_written" && r.granted);
  const voice = rows.some((r) => r.kind === "parent_voice" && r.granted);
  return child && voice;
}

export async function recordConsent(parentId: string, kind: "child_written" | "parent_voice", evidence: string) {
  const id = `con_${kind}_${parentId}`;
  await query(`delete from consents where parent_id = $1 and kind = $2`, [parentId, kind]);
  await query(`insert into consents values ($1,$2,$3,$4,$5,$6,$7)`, [
    id,
    parentId,
    kind,
    true,
    nowIst(),
    evidence,
    true,
  ]);
}
