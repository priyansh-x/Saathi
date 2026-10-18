/** In-memory latch loaded from ops_flags. Env SAATHI_KILL_SWITCH=1 still wins. */
let dbKillSwitch = false;

export function opsKillSwitchLatched() {
  return dbKillSwitch;
}

export function latchOpsKillSwitch(on: boolean) {
  dbKillSwitch = on;
}
