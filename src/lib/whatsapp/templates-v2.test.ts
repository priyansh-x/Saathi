import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { whatsappTemplatePack } from "@/lib/whatsapp/template-pack";
import { packTemplate } from "@/lib/whatsapp/templates";

const BODIES = {
  daily_briefing_good: {
    en: 'Saathi update for {{1}}: spoke with {{2}} at {{3}}. Medicines: {{4}}. {{2}} said: "{{5}}". No concerns today. Reply STOP to opt out.',
    hi: 'नमस्ते {{1}}, Saathi अपडेट: {{3}} बजे {{2}} से बात हुई। दवाइयाँ: {{4}}। {{2}} ने कहा: "{{5}}"। आज कोई चिंता की बात नहीं। रुकने के लिए STOP लिखें।',
  },
  daily_briefing_missed_med: {
    en: "Saathi update for {{1}}: spoke with {{2}} at {{3}}. Not taken yet: {{4}}. You may want to check in. Reply STOP to opt out.",
    hi: "नमस्ते {{1}}, Saathi अपडेट: {{3}} बजे {{2}} से बात हुई। अभी तक नहीं ली: {{4}}। आप एक बार हाल पूछ लें। रुकने के लिए STOP लिखें।",
  },
  daily_briefing_low_mood: {
    en: 'Saathi update for {{1}}: spoke with {{2}} at {{3}}. {{2}} sounded a little low today and said: "{{4}}". A call from you may help. Reply STOP to opt out.',
    hi: 'नमस्ते {{1}}, Saathi अपडेट: {{3}} बजे {{2}} से बात हुई। आज {{2}} थोड़े उदास लगे और कहा: "{{4}}"। आपका एक फ़ोन मदद कर सकता है। रुकने के लिए STOP लिखें।',
  },
  safety_alert_emergency: {
    en: 'Saathi alert for {{1}}: on today\'s call at {{4}}, {{2}} said "{{3}}". Please call {{2}} now. If you cannot reach them, call 112. Desk: {{5}}. Saathi is a companion call, not a medical service.',
    hi: 'Saathi अलर्ट ({{1}} के लिए): आज की कॉल में {{4}} बजे {{2}} ने कहा "{{3}}"। कृपया अभी {{2}} को फ़ोन करें। बात न हो पाए तो 112 पर कॉल करें। डेस्क: {{5}}। Saathi एक साथी कॉल है, मेडिकल सेवा नहीं।',
  },
  safety_alert_unreachable: {
    en: "Saathi alert for {{1}}: we could not reach {{2}} after {{3}} tries this morning. Please check on them. Desk: {{4}}. Saathi will try again tomorrow.",
    hi: "Saathi अलर्ट ({{1}} के लिए): आज सुबह {{3}} कोशिशों के बाद भी {{2}} से बात नहीं हो पाई। कृपया उनकी ख़बर लें। डेस्क: {{4}}। Saathi कल फिर कॉल करेगा।",
  },
} as const;

describe("WhatsApp template v2/v3 copy", () => {
  it("matches the Product-approved briefing and alert bodies", () => {
    for (const [name, langs] of Object.entries(BODIES)) {
      assert.equal(packTemplate(name, "en")?.body, langs.en, `${name}.en`);
      assert.equal(packTemplate(name, "hi")?.body, langs.hi, `${name}.hi`);
    }
  });

  it("does not start or end with a variable, and has no em dash", () => {
    const names = Object.keys(BODIES);
    for (const tpl of whatsappTemplatePack().filter((row) => names.includes(row.name))) {
      assert.equal(/^\{\{\d+\}\}/.test(tpl.body.trim()), false, `${tpl.name}/${tpl.language} starts with a variable`);
      assert.equal(/\{\{\d+\}\}$/.test(tpl.body.trim()), false, `${tpl.name}/${tpl.language} ends with a variable`);
      assert.equal(tpl.body.includes("—"), false, `${tpl.name}/${tpl.language} has an em dash`);
    }
  });

  it("keeps DRAFT md files in sync with the pack bodies", () => {
    const dir = path.join(process.cwd(), "docs/saathi/whatsapp/templates");
    for (const [name, langs] of Object.entries(BODIES)) {
      for (const language of ["en", "hi"] as const) {
        const text = readFileSync(path.join(dir, `${name}.${language}.md`), "utf8");
        assert.match(text, /Status: DRAFT/);
        assert.match(text, /Category: UTILITY/);
        assert.ok(text.includes(langs[language]));
        assert.equal(text.includes("—"), false);
      }
    }
  });
});
