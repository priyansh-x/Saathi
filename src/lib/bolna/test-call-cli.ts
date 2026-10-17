import { gateOutbound, normalizePhone } from "@/lib/outbound";

export function parseTestCallArgs(argv: string[]) {
  const yes = argv.includes("--yes");
  const phone = argv
    .filter((arg) => arg !== "--yes" && !arg.endsWith("test-call.ts") && !arg.endsWith("/tsx") && !arg.endsWith("node"))
    .find((arg) => /^\+?\d[\d\s-]*$/.test(arg));
  return { yes, phone: phone ? normalizePhone(phone) : "" };
}

export function plannedTestCall(phone: string) {
  const gate = gateOutbound("call", phone);
  return {
    post: "/call",
    to: gate.ok ? gate.to : phone,
    allowlisted: gate.ok,
    reason: gate.ok ? null : gate.reason,
    omits: ["from_phone_number"],
    timestamps: "+05:30 only, never Z",
  };
}

export function canPlaceLiveCall(phone: string, yes: boolean) {
  if (!yes) return { ok: false as const, reason: "missing_yes" };
  if (process.env.MOCK_BOLNA !== "0") return { ok: false as const, reason: "mock_on" };
  if (!phone) return { ok: false as const, reason: "missing_phone" };
  const gate = gateOutbound("call", phone);
  if (!gate.ok) return { ok: false as const, reason: gate.reason };
  return { ok: true as const, to: gate.to };
}
