import { randomBytes } from "node:crypto";
import { query } from "@/lib/db/client";
import { nowIstStamp } from "@/lib/time";

export type AuditWhat = {
  action: string;
  before?: unknown;
  after?: unknown;
};

export async function writeAudit(parentId: string, who: string, what: AuditWhat, isExample = false) {
  await query(`insert into audit_events (id, parent_id, who, what, at, is_example) values ($1,$2,$3,$4,$5,$6)`, [
    `aud_${randomBytes(6).toString("hex")}`,
    parentId,
    who,
    JSON.stringify(what),
    nowIstStamp(),
    isExample,
  ]);
}

export async function auditsFor(parentId: string) {
  return query<{ id: string; who: string; what: string; at: string }>(
    `select id, who, what, at from audit_events where parent_id = $1 order by at desc, id desc`,
    [parentId],
  );
}
