import { sendWhatsappToContact } from "@/lib/bolna/assist-tools";
import { toolRoute } from "@/lib/bolna/tool-route";

export const POST = toolRoute("send_whatsapp_message", ["recipient", "message"], sendWhatsappToContact);
