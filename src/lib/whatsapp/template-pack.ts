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
};

const URL_TODAY = "https://saathi.example/d/{{1}}";
const URL_EXAMPLE = "example-kamla";

function pair(
  name: string,
  en: { body: string; buttons: TemplateButton[]; examples: string[] },
  hi: { body: string; buttons: TemplateButton[]; examples: string[] },
): WhatsappTemplate[] {
  return [
    { name, language: "en", category: "UTILITY", ...en },
    { name, language: "hi", category: "UTILITY", ...hi },
  ];
}

export function whatsappTemplatePack(): WhatsappTemplate[] {
  return [
    ...pair(
      "daily_briefing_good",
      {
        body: '✅ {{1}} is doing well today.\nPicked up at {{2}} and {{3}}. In her words: "{{4}}".',
        buttons: [
          { type: "URL", text: "Open today", url: URL_TODAY, example: URL_EXAMPLE },
          { type: "QUICK_REPLY", text: "Message Maa" },
        ],
        examples: ["Maa", "8:04 AM", "took both tablets (BP, sugar)", "Ghutne ka dard aaj kam hai."],
      },
      {
        body: '✅ {{1}} आज ठीक हैं।\nसुबह {{2}} बजे फ़ोन उठाया और {{3}}। उन्होंने कहा: "{{4}}".',
        buttons: [
          { type: "URL", text: "आज खोलें", url: URL_TODAY, example: URL_EXAMPLE },
          { type: "QUICK_REPLY", text: "Maa ko sandesh" },
        ],
        examples: ["माँ", "8:04", "दोनों गोलियाँ (BP, शुगर) ले लीं", "घुटने का दर्द आज कम है"],
      },
    ),
    ...pair(
      "daily_briefing_missed_med",
      {
        body: "⚠️ {{1}} is fine, but missed a medicine today.\n{{2}} not taken ({{3}}). I'll remind her again tomorrow morning.",
        buttons: [
          { type: "URL", text: "Open today", url: URL_TODAY, example: URL_EXAMPLE },
          { type: "QUICK_REPLY", text: "Message Maa" },
        ],
        examples: ["Maa", "Sugar tablet (morning)", "she said khatam ho gayi hai"],
      },
      {
        body: "⚠️ {{1}} ठीक हैं, पर आज एक दवाई छूट गई।\n{{2}} नहीं ली ({{3}})। कल सुबह मैं फिर याद दिलाऊँगी।",
        buttons: [
          { type: "URL", text: "आज खोलें", url: URL_TODAY, example: URL_EXAMPLE },
          { type: "QUICK_REPLY", text: "Maa ko sandesh" },
        ],
        examples: ["माँ", "शुगर की गोली (सुबह)", "उन्होंने कहा ख़त्म हो गई है"],
      },
    ),
    ...pair(
      "daily_briefing_low_mood",
      {
        body: '⚠️ {{1}} took her medicines but sounded low today.\nShe said: "{{2}}". A call from you this evening could help.',
        buttons: [
          { type: "URL", text: "Open today", url: URL_TODAY, example: URL_EXAMPLE },
          { type: "QUICK_REPLY", text: "Message Maa" },
        ],
        examples: ["Maa", "Aaj mann nahi lag raha."],
      },
      {
        body: '⚠️ {{1}} ने दवाई ली, पर आज उदास लगीं।\nउन्होंने कहा: "{{2}}". आज शाम आपका एक फ़ोन अच्छा रहेगा।',
        buttons: [
          { type: "URL", text: "आज खोलें", url: URL_TODAY, example: URL_EXAMPLE },
          { type: "QUICK_REPLY", text: "Maa ko sandesh" },
        ],
        examples: ["माँ", "आज मन नहीं लग रहा।"],
      },
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
        body: "🔴 Still can't reach {{1}}: {{2}} tries since {{3}}.\n{{4}} has been asked to check on her. Her number: {{5}}. Please reply when you know she's OK.",
        buttons: [
          { type: "QUICK_REPLY", text: "I'm on it" },
          { type: "QUICK_REPLY", text: "She's OK" },
          { type: "QUICK_REPLY", text: "Can't reach her" },
        ],
        examples: ["Maa", "4", "8:00 AM IST", "Sunita ji", "+910000000000"],
      },
      {
        body: "🔴 {{1}} से अब भी बात नहीं हुई: {{3}} से {{2}} बार कोशिश।\n{{4}} से देखने को कहा गया है। उनका नंबर: {{5}}। ठीक होने की ख़बर मिले तो बताइए।",
        buttons: [
          { type: "QUICK_REPLY", text: "मैं देख रहा/रही हूँ" },
          { type: "QUICK_REPLY", text: "वो ठीक हैं" },
          { type: "QUICK_REPLY", text: "बात नहीं हुई" },
        ],
        examples: ["माँ", "4", "8:00", "सुनीता जी", "+910000000000"],
      },
    ),
    ...pair(
      "safety_alert_emergency",
      {
        body: '🔴 URGENT: {{1}} needs help now.\nOn today\'s call at {{2}} she said: "{{3}}". I told her to call 112 or someone nearby. {{4}} has also been alerted. Her number: {{5}}.',
        buttons: [
          { type: "QUICK_REPLY", text: "I'm on it" },
          { type: "QUICK_REPLY", text: "Can't reach her" },
          { type: "QUICK_REPLY", text: "False alarm" },
        ],
        examples: ["Maa", "8:09 AM IST", "Bathroom mein gir gayi, uth nahi pa rahi.", "Sunita ji (neighbour)", "+910000000000"],
      },
      {
        body: '🔴 ज़रूरी: {{1}} को अभी मदद चाहिए।\nआज {{2}} बजे की कॉल पर उन्होंने कहा: "{{3}}". मैंने उन्हें 112 या किसी पास वाले को फ़ोन करने को कहा। {{4}} को भी बताया गया है। उनका नंबर: {{5}}।',
        buttons: [
          { type: "QUICK_REPLY", text: "मैं देख रहा/रही हूँ" },
          { type: "QUICK_REPLY", text: "बात नहीं हुई" },
          { type: "QUICK_REPLY", text: "ग़लत अलार्म" },
        ],
        examples: ["माँ", "8:09", "बाथरूम में गिर गई, उठ नहीं पा रही।", "सुनीता जी (पड़ोसन)", "+910000000000"],
      },
    ),
    ...pair(
      "safety_alert_urgent",
      {
        body: '⚠️ Please check in with {{1}} today.\nOn the {{2}} call she said: "{{3}}". She sounded {{4}}. Nothing else urgent came up.',
        buttons: [
          { type: "QUICK_REPLY", text: "I'll call her" },
          { type: "QUICK_REPLY", text: "Ask neighbour" },
          { type: "QUICK_REPLY", text: "Seen" },
        ],
        examples: ["Maa", "8:10 AM IST", "Bank wale bole KYC karna hai, OTP maang rahe the.", "uneasy"],
      },
      {
        body: '⚠️ आज {{1}} से ज़रूर बात कर लीजिए।\n{{2}} बजे की कॉल पर उन्होंने कहा: "{{3}}". आवाज़ से वो {{4}} लगीं। और कुछ ज़रूरी नहीं था।',
        buttons: [
          { type: "QUICK_REPLY", text: "मैं कॉल करूँ" },
          { type: "QUICK_REPLY", text: "पड़ोसी से पूछें" },
          { type: "QUICK_REPLY", text: "देख लिया" },
        ],
        examples: ["माँ", "8:10", "बैंक वाले बोले KYC करना है, OTP माँग रहे थे।", "घबराई हुई"],
      },
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
