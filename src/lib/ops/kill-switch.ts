import { randomBytes } from "node:crypto";
import { query } from "@/lib/db/client";
import { latchOpsKillSwitch } from "@/lib/ops/flags";
import { nowIstStamp } from "@/lib/time";

export async function loadOpsKillSwitch() {
  try {
    const rows = await query<{ value: string }>(`select value from ops_flags where key = 'kill_switch'`);
    latchOpsKillSwitch(rows[0]?.value === "1");
  } catch {
    latchOpsKillSwitch(false);
  }
}

export async function setOpsKillSwitch(on: boolean, who: string) {
  latchOpsKillSwitch(on);
  const at = nowIstStamp();
  await query(
    `insert into ops_flags (key, value, updated_at, updated_by) values ('kill_switch', $1, $2, $3)
     on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    [on ? "1" : "0", at, who],
  );
  await query(`insert into ops_audit (id, who, what, at) values ($1,$2,$3,$4)`, [
    `ops_${randomBytes(6).toString("hex")}`,
    who,
    JSON.stringify({ action: "kill_switch", after: on }),
    at,
  ]);
}
