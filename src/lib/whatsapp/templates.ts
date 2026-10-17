/** Copy lives in docs/saathi/product/whatsapp_templates.md. These names are the shipped Meta templates. */
export type TemplateName =
  | "hello_world"
  | "daily_briefing_en"
  | "daily_briefing_hi"
  | "safety_alert_en"
  | "safety_alert_hi"
  | "responder_en"
  | "responder_hi"
  | "alert_ack_update_en"
  | "alert_ack_update_hi";

export function renderTemplate(name: TemplateName, vars: string[]) {
  const v = (i: number) => vars[i] ?? "—";
  switch (name) {
    case "hello_world":
      return "Hello World";
    case "daily_briefing_en":
      return `Saathi called ${v(0)} this morning (${v(1)} IST).\nStatus: ${v(2)}\nMedicines: ${v(3)}\nShe said: "${v(4)}"\nOpen today: ${v(5)}`;
    case "daily_briefing_hi":
      return `साथी ने सुबह ${v(0)} से बात की (${v(1)} IST)।\nस्थिति: ${v(2)}\nदवाई: ${v(3)}\nउन्होंने कहा: "${v(4)}"\nआज: ${v(5)}`;
    case "safety_alert_en":
      return `Act now. ${v(0)} said: "${v(1)}" at ${v(2)} IST.\n${v(3)} and ${v(4)} were notified.\nReply if you are going. Details: ${v(5)}`;
    case "safety_alert_hi":
      return `अभी देखें। ${v(0)} ने कहा: "${v(1)}" — ${v(2)} IST।\n${v(3)} और ${v(4)} को सूचना गई।\nजा रहे हैं तो जवाब दें। ${v(5)}`;
    case "responder_en":
      return `${v(0)} may need someone at the door. ${v(1)} at ${v(2)} IST.\nQuick replies: I'm going | Can't right now`;
    case "responder_hi":
      return `${v(0)} के दरवाज़े पर किसी की ज़रूरत हो सकती है। ${v(1)} — ${v(2)} IST।\nजवाब: मैं जा रहा/रही हूँ | अभी नहीं`;
    case "alert_ack_update_en":
      return `${v(0)} is on it (${v(1)}). Saathi will not keep pinging.`;
    case "alert_ack_update_hi":
      return `${v(0)} देख रहे हैं (${v(1)})। साथी दोबारा नहीं पूछेगा।`;
  }
}
