import type { AlertRow, CallRow, Contact, Parent } from "@/lib/db/types";
import { previewFamilyMessage, type WhatsappPreview } from "@/lib/whatsapp/preview";
import type { TemplateName } from "@/lib/whatsapp/templates";
import { formatIstTime } from "@/lib/time";

export function buildAdminWhatsappPreview(args: {
  parent: Parent;
  child: Contact | null;
  latestCall: (CallRow & { mood?: CallRow["mood"] }) | null;
  latestAlert: AlertRow | null;
  deskUrl: string;
}): WhatsappPreview | null {
  const child = args.child;
  if (!child) return null;
  const who = args.parent.address_term?.trim() || args.parent.first_name;
  const locale = child.locale === "hi" ? "hi" : "en";
  const storedOptIn = Boolean(child.whatsapp_opt_in);
  const optedOut = Boolean(child.whatsapp_opted_out_at);
  if (args.latestAlert) {
    const time = args.latestAlert.created_at.includes("T") ? args.latestAlert.created_at.slice(11, 16) : "08:33";
    const intended = (
      args.latestAlert.category === "MISSED" || args.latestAlert.level === "look"
        ? "safety_alert_unreachable"
        : args.latestAlert.category === "EMERGENCY" || args.latestAlert.level === "act"
          ? "safety_alert_emergency"
          : "safety_alert_urgent"
    ) as Exclude<TemplateName, "hello_world">;
    const vars =
      intended === "safety_alert_unreachable"
        ? [child.first_name, who, "3", args.deskUrl]
        : [child.first_name, who, args.latestAlert.quote, time, args.deskUrl];
    return previewFamilyMessage({
      toPhone: child.phone,
      locale,
      template: intended,
      vars,
      storedOptIn,
      optedOut,
      lastInboundAt: child.last_inbound_at,
    });
  }
  if (!args.latestCall) return null;
  const time = formatIstTime(args.parent.call_time);
  const intended = (
    args.latestCall.status === "completed"
      ? args.latestCall.mood === "low"
        ? "daily_briefing_low_mood"
        : "daily_briefing_good"
      : "missed_call_soft"
  ) as Exclude<TemplateName, "hello_world">;
  const vars =
    intended === "daily_briefing_good"
      ? [child.first_name, who, time, "—", args.latestCall.mood_quote || "—"]
      : intended === "daily_briefing_low_mood"
        ? [child.first_name, who, time, args.latestCall.mood_quote || "—"]
        : [who, "1", args.parent.call_time, args.parent.call_time, args.parent.phone];
  return previewFamilyMessage({
    toPhone: child.phone,
    locale,
    template: intended,
    vars,
    storedOptIn,
    optedOut,
    lastInboundAt: child.last_inbound_at,
  });
}
