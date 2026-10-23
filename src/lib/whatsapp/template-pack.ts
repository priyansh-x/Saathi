/**
 * Wording is owned by docs/saathi/product/whatsapp_templates.md.
 * This pack is the Meta-shaped copy Priyansh pastes. Do not submit from here.
 */

export type TemplateButton =
  | { type: "QUICK_REPLY"; text: string }
  | { type: "URL"; text: string; url: string; example: string };

export type WhatsappTemplate = {
  name: string;
  language: "en" | "hi";
  category: "UTILITY";
  body: string;
  buttons: TemplateButton[];
  examples: string[];
  status?: "DRAFT";
};

const URL_TODAY = "https://saathi.example/d/{{1}}";
const URL_EXAMPLE = "example-kamla";

function pair(
  name: string,
  en: { body: string; buttons: TemplateButton[]; examples: string[] },
  hi: { body: string; buttons: TemplateButton[]; examples: string[] },
  status?: "DRAFT",
): WhatsappTemplate[] {
  const extra = status ? { status } : {};
  return [
    { name, language: "en", category: "UTILITY", ...en, ...extra },
    { name, language: "hi", category: "UTILITY", ...hi, ...extra },
  ];
}

export function whatsappTemplatePack(): WhatsappTemplate[] {
  return [
    ...pair(
      "daily_briefing_good",
      {
        body: 'Saathi update for {{1}}: spoke with {{2}} at {{3}}, all good. Medicines: {{4}}. "{{5}}"',
        buttons: [],
        examples: ["Rohit", "Kamla", "8:04 AM IST", "took both tablets (BP, sugar)", "Ghutne ka dard aaj kam hai."],
      },
      {
        body: '{{1}} के लिए साथी अपडेट: {{3}} बजे {{2}} से बात हुई, सब ठीक है। दवाइयाँ: {{4}}। "{{5}}"',
        buttons: [],
        examples: ["रोहित", "कमला", "8:04", "दोनों गोलियाँ (BP, शुगर) ले लीं", "घुटने का दर्द आज कम है"],
      },
      "DRAFT",
    ),
    ...pair(
      "daily_briefing_missed_med",
      {
        body: "Saathi update for {{1}}: spoke with {{2}} at {{3}}. Not taken yet: {{4}}. You may want to check in.",
        buttons: [],
        examples: ["Rohit", "Kamla", "8:04 AM IST", "Sugar tablet (morning)"],
      },
      {
        body: "{{1}} के लिए साथी अपडेट: {{3}} बजे {{2}} से बात हुई। अभी तक नहीं ली: {{4}}। आप एक बार हाल पूछ लें।",
        buttons: [],
        examples: ["रोहित", "कमला", "8:04", "शुगर की गोली (सुबह)"],
      },
      "DRAFT",
    ),
    ...pair(
      "daily_briefing_low_mood",
      {
        body: 'Saathi update for {{1}}: spoke with {{2}} at {{3}}. {{2}} sounded low today: "{{4}}". A call from you may help.',
        buttons: [],
        examples: ["Rohit", "Kamla", "8:04 AM IST", "Aaj mann nahi lag raha."],
      },
      {
        body: '{{1}} के लिए साथी अपडेट: {{3}} बजे {{2}} से बात हुई। आज {{2}} थोड़े उदास लगे: "{{4}}"। आपका एक फ़ोन मदद कर सकता है।',
        buttons: [],
        examples: ["रोहित", "कमला", "8:04", "आज मन नहीं लग रहा।"],
      },
      "DRAFT",
    ),
    ...pair(
      "missed_call_soft",
      {
        body: "⚠️ Couldn't reach {{1}} yet: {{2}} tries since {{3}}.\nI'll try again at {{4}}. Her number: {{5}}.",
        buttons: [
          { type: "QUICK_REPLY", text: "I'll call her" },
          { type: "QUICK_REPLY", text: "She's OK" },
          { type: "QUICK_REPLY", text: "Ask neighbour" },
        ],
        examples: ["Maa", "2", "8:30 AM IST", "9:00 AM IST", "+910000000000"],
      },
      {
        body: "⚠️ {{1}} से अभी बात नहीं हो पाई: {{3}} से {{2}} बार कोशिश की।\n{{4}} बजे फिर कोशिश करूँगी। उनका नंबर: {{5}}।",
        buttons: [
          { type: "QUICK_REPLY", text: "मैं कॉल करूँ" },
          { type: "QUICK_REPLY", text: "वो ठीक हैं" },
          { type: "QUICK_REPLY", text: "पड़ोसी से पूछें" },
        ],
        examples: ["माँ", "2", "8:30", "9:00", "+910000000000"],
      },
    ),
    ...pair(
      "safety_alert_unreachable",
      {
        body: "Saathi alert for {{1}}: we could not reach {{2}} after {{3}} tries this morning. Please check on them. Desk: {{4}}",
        buttons: [],
        examples: ["Rohit", "Kamla", "3", "https://saathi.example/d/example-kamla"],
      },
      {
        body: "{{1}} के लिए साथी अलर्ट: आज सुबह {{3}} कोशिशों के बाद भी {{2}} से बात नहीं हो पाई। कृपया उनका हाल लें। डेस्क: {{4}}",
        buttons: [],
        examples: ["रोहित", "कमला", "3", "https://saathi.example/d/example-kamla"],
      },
      "DRAFT",
    ),
    ...pair(
      "safety_alert_unreachable_solo",
      {
        body: "Saathi alert for {{1}}: we could not reach {{2}} after {{3}} tries this morning. Please check on them. Desk: {{4}}",
        buttons: [],
        examples: ["Rohit", "Kamla", "3", "https://saathi.example/d/example-kamla"],
      },
      {
        body: "{{1}} के लिए साथी अलर्ट: आज सुबह {{3}} कोशिशों के बाद भी {{2}} से बात नहीं हो पाई। कृपया उनका हाल लें। डेस्क: {{4}}",
        buttons: [],
        examples: ["रोहित", "कमला", "3", "https://saathi.example/d/example-kamla"],
      },
      "DRAFT",
    ),
    ...pair(
      "safety_alert_emergency",
      {
        body: 'Saathi alert for {{1}}: on today\'s call {{2}} said "{{3}}" at {{4}}. Please call {{2}} now. If you cannot reach them, call 112. Open the desk: {{5}}',
        buttons: [],
        examples: [
          "Rohit",
          "Kamla",
          "Bathroom mein gir gayi, uth nahi pa rahi.",
          "8:09 AM IST",
          "https://saathi.example/d/example-kamla",
        ],
      },
      {
        body: '{{1}} के लिए साथी अलर्ट: आज की कॉल पर {{4}} बजे {{2}} ने कहा "{{3}}"। कृपया अभी {{2}} को फ़ोन करें। बात न हो पाए तो 112 पर कॉल करें। डेस्क खोलें: {{5}}',
        buttons: [],
        examples: ["रोहित", "कमला", "बाथरूम में गिर गई, उठ नहीं पा रही।", "8:09", "https://saathi.example/d/example-kamla"],
      },
      "DRAFT",
    ),
    ...pair(
      "safety_alert_emergency_solo",
      {
        body: 'Saathi alert for {{1}}: on today\'s call {{2}} said "{{3}}" at {{4}}. Please call {{2}} now. If you cannot reach them, call 112. Open the desk: {{5}}',
        buttons: [],
        examples: [
          "Rohit",
          "Kamla",
          "Bathroom mein gir gayi, uth nahi pa rahi.",
          "8:09 AM IST",
          "https://saathi.example/d/example-kamla",
        ],
      },
      {
        body: '{{1}} के लिए साथी अलर्ट: आज की कॉल पर {{4}} बजे {{2}} ने कहा "{{3}}"। कृपया अभी {{2}} को फ़ोन करें। बात न हो पाए तो 112 पर कॉल करें। डेस्क खोलें: {{5}}',
        buttons: [],
        examples: ["रोहित", "कमला", "बाथरूम में गिर गई, उठ नहीं पा रही।", "8:09", "https://saathi.example/d/example-kamla"],
      },
      "DRAFT",
    ),
    ...pair(
      "safety_alert_urgent",
      {
        body: 'Saathi alert for {{1}}: on today\'s call {{2}} said "{{3}}" at {{4}}. Please check in. Desk: {{5}}',
        buttons: [],
        examples: [
          "Rohit",
          "Kamla",
          "Bank wale bole KYC karna hai, OTP maang rahe the.",
          "8:10 AM IST",
          "https://saathi.example/d/example-kamla",
        ],
      },
      {
        body: '{{1}} के लिए साथी अलर्ट: आज की कॉल पर {{4}} बजे {{2}} ने कहा "{{3}}"। कृपया एक बार हाल ले लें। डेस्क: {{5}}',
        buttons: [],
        examples: ["रोहित", "कमला", "बैंक वाले बोले KYC करना है, OTP माँग रहे थे।", "8:10", "https://saathi.example/d/example-kamla"],
      },
      "DRAFT",
    ),
    ...pair(
      "safety_alert_urgent_solo",
      {
        body: 'Saathi alert for {{1}}: on today\'s call {{2}} said "{{3}}" at {{4}}. Please check in. Desk: {{5}}',
        buttons: [],
        examples: [
          "Rohit",
          "Kamla",
          "Bank wale bole KYC karna hai, OTP maang rahe the.",
          "8:10 AM IST",
          "https://saathi.example/d/example-kamla",
        ],
      },
      {
        body: '{{1}} के लिए साथी अलर्ट: आज की कॉल पर {{4}} बजे {{2}} ने कहा "{{3}}"। कृपया एक बार हाल ले लें। डेस्क: {{5}}',
        buttons: [],
        examples: ["रोहित", "कमला", "बैंक वाले बोले KYC करना है, OTP माँग रहे थे।", "8:10", "https://saathi.example/d/example-kamla"],
      },
      "DRAFT",
    ),
    ...pair(
      "alert_ack_update",
      {
        body: "✅ {{1}} is on it ({{2}}).\nWe'll update you when {{3}} is confirmed OK.",
        buttons: [],
        examples: ["Rohit", "8:14 AM IST", "Maa"],
      },
      {
        body: "✅ {{1}} देख रहे हैं ({{2}})। {{3}} के ठीक होने की पुष्टि होते ही बताएँगे।",
        buttons: [],
        examples: ["रोहित", "8:14", "माँ"],
      },
    ),
    ...pair(
      "responder_optin",
      {
        body: "Namaste {{1}} ji, {{2}} has added you as a trusted neighbour for their mother, {{3}} ({{4}}).\nIf we ever can't reach her, or she reports a fall, Saathi will message you here so you can check on her. No daily messages. Are you okay with this?",
        buttons: [
          { type: "QUICK_REPLY", text: "Yes" },
          { type: "QUICK_REPLY", text: "No" },
        ],
        examples: ["Sunita", "Rohit", "Kamla", "B-12, Shanti Nagar"],
      },
      {
        body: "नमस्ते {{1}} जी, {{2}} ने आपको अपनी माँ {{3}} ({{4}}) के लिए भरोसेमंद पड़ोसी के रूप में जोड़ा है।\nअगर कभी उनसे संपर्क न हो या वो गिर जाएँ, तो साथी आपको यहाँ एक मैसेज भेजेगा ताकि आप उन्हें देख सकें। रोज़ कोई मैसेज नहीं आएगा। क्या आप तैयार हैं?",
        buttons: [
          { type: "QUICK_REPLY", text: "Haan, theek hai" },
          { type: "QUICK_REPLY", text: "Nahi" },
        ],
        examples: ["सुनीता", "रोहित", "कमला", "B-12, शांति नगर"],
      },
    ),
    ...pair(
      "responder_alert_emergency",
      {
        body: "🔴 {{1}} ji, can you check on {{2}} ji ({{3}}) right now?\nShe just said on a call that {{4}}. Her son {{5}} has been told. If needed, call 112.",
        buttons: [
          { type: "QUICK_REPLY", text: "I'm going" },
          { type: "QUICK_REPLY", text: "Can't go now" },
        ],
        examples: ["Sunita", "Kamla", "B-12, Shanti Nagar", "she fell and can't get up", "Rohit"],
      },
      {
        body: "🔴 {{1}} जी, क्या आप अभी {{2}} जी ({{3}}) को देख सकते हैं?\nउन्होंने अभी फ़ोन पर बताया कि {{4}}। उनके बेटे {{5}} को बता दिया गया है। ज़रूरत हो तो 112 पर कॉल करें।",
        buttons: [
          { type: "QUICK_REPLY", text: "Main ja raha/rahi hoon" },
          { type: "QUICK_REPLY", text: "Abhi nahi ja sakta" },
        ],
        examples: ["सुनीता", "कमला", "B-12, शांति नगर", "गिर गई हैं और उठ नहीं पा रही", "रोहित"],
      },
    ),
    ...pair(
      "responder_alert_unreachable",
      {
        body: "⚠️ {{1}} ji, {{2}} ji ({{3}}) hasn't answered her phone since this morning. Could you check on her once? Her son {{4}} knows.",
        buttons: [
          { type: "QUICK_REPLY", text: "I'm going" },
          { type: "QUICK_REPLY", text: "Can't go now" },
        ],
        examples: ["Sunita", "Kamla", "B-12, Shanti Nagar", "Rohit"],
      },
      {
        body: "⚠️ {{1}} जी, {{2}} जी ({{3}}) सुबह से फ़ोन नहीं उठा रहीं। क्या आप एक बार जाकर देख सकते हैं? उनके बेटे {{4}} को पता है।",
        buttons: [
          { type: "QUICK_REPLY", text: "Main ja raha/rahi hoon" },
          { type: "QUICK_REPLY", text: "Abhi nahi ja sakta" },
        ],
        examples: ["सुनीता", "कमला", "B-12, शांति नगर", "रोहित"],
      },
    ),
    ...pair(
      "weekly_summary",
      {
        body: "🗓 {{1}}'s week ({{2}}): answered {{3}} of 7 calls, took {{4}} of {{5}} doses.\nMood: {{6}}. Notable: {{7}}. Tap below for the full week.",
        buttons: [
          { type: "URL", text: "See the week", url: URL_TODAY, example: URL_EXAMPLE },
          { type: "QUICK_REPLY", text: "Change something" },
        ],
        examples: [
          "Maa",
          "11–17 Oct",
          "6",
          "12",
          "14",
          "mostly cheerful, low on Thursday",
          "knee pain better since Wednesday",
        ],
      },
      {
        body: "🗓 {{1}} का हफ़्ता ({{2}}): 7 में से {{3}} कॉल उठाईं, {{5}} में से {{4}} दवाइयाँ लीं।\nमन: {{6}}। ख़ास बातें: {{7}}। पूरा हफ़्ता नीचे देखें।",
        buttons: [
          { type: "URL", text: "हफ़्ता देखें", url: URL_TODAY, example: URL_EXAMPLE },
          { type: "QUICK_REPLY", text: "कुछ बदलें" },
        ],
        examples: ["माँ", "11–17 अक्तूबर", "6", "12", "14", "ज़्यादातर हल्की, गुरुवार को उदास", "बुधवार से घुटने का दर्द कम"],
      },
    ),
    ...pair(
      "consent_declined",
      {
        body: "{{1}} said no to the daily Saathi call. Morning calls are paused. In an emergency call 112.",
        buttons: [],
        examples: ["Maa"],
      },
      {
        body: "{{1}} ने रोज़ की साथी कॉल मना कर दी। सुबह की कॉल रुक गई। आपात में 112 मिलाएँ।",
        buttons: [],
        examples: ["माँ"],
      },
    ),
    ...pair(
      "consent_later",
      {
        body: "{{1}} has not said yes or no to the daily Saathi call after two mornings. Saathi will not call again until you decide. In an emergency call 112.",
        buttons: [],
        examples: ["Maa"],
      },
      {
        body: "{{1}} ने दो सुबह हाँ या नहीं नहीं कहा। आप तय करें तब तक साथी फ़ोन नहीं करेगा। आपात में 112 मिलाएँ।",
        buttons: [],
        examples: ["माँ"],
      },
    ),
    ...pair(
      "parent_relay",
      {
        body: '💬 {{1}} asked me to tell you: "{{2}}". (From today\'s {{3}} call.)',
        buttons: [
          { type: "QUICK_REPLY", text: "Calling her" },
          { type: "QUICK_REPLY", text: "Reply via Saathi" },
        ],
        examples: ["Maa", "Please buy sugar tablets.", "8:30 AM"],
      },
      {
        body: '💬 {{1}} ने कहा आपको बताऊँ: "{{2}}". (आज की {{3}} कॉल से।)',
        buttons: [
          { type: "QUICK_REPLY", text: "मैं कॉल करूँ" },
          { type: "QUICK_REPLY", text: "साथी से जवाब" },
        ],
        examples: ["माँ", "शुगर की गोली ले आइए।", "8:30"],
      },
    ),
    ...pair(
      "onboarding_reminder",
      {
        body: "👋 Your Saathi setup for {{1}} is almost done. It takes about 2 minutes to finish.",
        buttons: [{ type: "URL", text: "Finish setup", url: URL_TODAY, example: URL_EXAMPLE }],
        examples: ["Maa"],
      },
      {
        body: "👋 {{1}} के लिए साथी सेटअप लगभग पूरा है। ख़त्म करने में लगभग 2 मिनट लगेंगे।",
        buttons: [{ type: "URL", text: "सेटअप पूरा करें", url: URL_TODAY, example: URL_EXAMPLE }],
        examples: ["माँ"],
      },
    ),
  ];
}

export function bodyVariables(body: string) {
  const found = [...body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
  return [...new Set(found)].sort((a, b) => a - b);
}

export function assertTemplatePack(pack: WhatsappTemplate[]) {
  for (const tpl of pack) {
    const vars = bodyVariables(tpl.body);
    if (vars[0] !== 1 || vars.some((n, i) => n !== i + 1)) {
      throw new Error(`${tpl.name}/${tpl.language}: variable numbering must be continuous from {{1}}`);
    }
    if (tpl.examples.length !== vars.length) {
      throw new Error(`${tpl.name}/${tpl.language}: every variable needs an EXAMPLE value`);
    }
    if (tpl.body.length > 1024) {
      throw new Error(`${tpl.name}/${tpl.language}: body is ${tpl.body.length} chars (max 1024)`);
    }
    if (!tpl.examples.every((v) => v.trim())) {
      throw new Error(`${tpl.name}/${tpl.language}: empty example`);
    }
  }
  const names = [...new Set(pack.map((t) => t.name))];
  for (const name of names) {
    const en = pack.find((t) => t.name === name && t.language === "en");
    const hi = pack.find((t) => t.name === name && t.language === "hi");
    if (!en || !hi) throw new Error(`${name}: need both en and hi`);
    const a = bodyVariables(en.body).join(",");
    const b = bodyVariables(hi.body).join(",");
    if (a !== b) throw new Error(`${name}: Hindi and English must have the same variables (${a} vs ${b})`);
  }
}

export function formatTemplatesForMeta(pack: WhatsappTemplate[]) {
  const lines = [
    "Paste into Meta template manager. Do not submit from this script.",
    "All example values are EXAMPLE (Kamla / Rohit / Sunita household).",
    "",
  ];
  for (const tpl of pack) {
    lines.push(`=== ${tpl.name} / ${tpl.language} ===`);
    lines.push(`Category: ${tpl.category}`);
    if (tpl.status) lines.push(`Status: ${tpl.status}`);
    lines.push("Body:");
    lines.push(tpl.body);
    lines.push("Example values (EXAMPLE):");
    tpl.examples.forEach((value, i) => lines.push(`  {{${i + 1}}} = ${value}`));
    if (tpl.buttons.length) {
      lines.push("Buttons:");
      for (const btn of tpl.buttons) {
        if (btn.type === "QUICK_REPLY") lines.push(`  QUICK_REPLY: ${btn.text}`);
        else lines.push(`  URL: ${btn.text} → ${btn.url} (example ${btn.example})`);
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}
