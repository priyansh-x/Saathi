import { voiceAlertChild } from "@/lib/config";
import { contactsFor } from "@/lib/db/queries";
import { logOutbound } from "@/lib/whatsapp/send";

export async function optionalChildVoiceAlert(parentId: string, alertId: string) {
  if (!voiceAlertChild()) return { skipped: true as const };
  const child = (await contactsFor(parentId)).find((c) => c.role === "child");
  if (!child) return { skipped: true as const };
  await logOutbound({
    id: `out_voice_${alertId}`,
    parentId,
    channel: "whatsapp",
    template: "voice_alert_child",
    to: child.phone,
    body: "Optional voice alert to child (flag on). Not placed unless allowlisted.",
    status: "queued_flag",
  });
  return { skipped: false as const };
}
