import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";
import { sendDailyBriefing } from "@/lib/whatsapp/notify";
import { mockLoggedWhatsapp } from "@/lib/whatsapp/mock-log";
import {
  emptyQuoteFallback,
  familyTemplateLanguage,
  quoteParam,
  whatsappVarsAreSafe,
} from "@/lib/whatsapp/quote-param";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.MOCK_EMAIL = "1";
process.env.SAATHI_KILL_SWITCH = "0";
process.env.CALL_PROVIDER = "simulated";
process.env.PARTNER_MODE = "mock";

const EM_DASH = "\u2014";
const EN_DASH = "\u2013";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("WhatsApp quote fallback", () => {
  it("uses family language and never an empty or em-dash placeholder", () => {
    assert.equal(familyTemplateLanguage("hi,en"), "hi");
    assert.equal(familyTemplateLanguage("en,hi"), "en");
    assert.equal(emptyQuoteFallback("en"), "no words recorded today");
    assert.equal(emptyQuoteFallback("hi"), "आज कोई बात दर्ज नहीं हुई");
    assert.equal(quoteParam("", "en"), "no words recorded today");
    assert.equal(quoteParam("   ", "hi"), "आज कोई बात दर्ज नहीं हुई");
    assert.equal(quoteParam("Ghutne ka dard.", "en"), "Ghutne ka dard.");
    const en = ["Rohit", "Kamla", "8:05 AM", "today's medicines", quoteParam("", "en")];
    const hi = ["रोहित", "कमला", "8:05", "आज की दवा", quoteParam("", "hi")];
    assert.equal(whatsappVarsAreSafe(en), true);
    assert.equal(whatsappVarsAreSafe(hi), true);
    assert.equal(whatsappVarsAreSafe(["ok", EM_DASH]), false);
    assert.equal(whatsappVarsAreSafe(["ok", ""]), false);
    assert.equal(whatsappVarsAreSafe(["ok", EN_DASH]), false);
    assert.equal(en.some((v) => v.includes(EM_DASH) || v.includes(EN_DASH) || v.length === 0), false);
    assert.equal(hi.some((v) => v.includes(EM_DASH) || v.includes(EN_DASH) || v.length === 0), false);
  });

  it("fills empty briefing quotes from family language when sending", async () => {
    await seed();
    await query(`update contacts set whatsapp_opt_in = true where id = 'contact_rohit'`);
    await query(`update parents set languages = 'en,hi' where id = 'parent_kamla'`);
    mockLoggedWhatsapp.length = 0;
    const good = await sendDailyBriefing("parent_kamla", {
      id: `quote_en_${Date.now()}`,
      mood_quote: "",
      status: "completed",
    });
    assert.equal(good.ok, true);
    const enEntry = mockLoggedWhatsapp.find((row) => row.name === "daily_briefing_good");
    assert.ok(enEntry);
    assert.equal(whatsappVarsAreSafe(enEntry!.vars), true);
    assert.equal(enEntry!.vars.at(-1), "no words recorded today");

    mockLoggedWhatsapp.length = 0;
    await query(`update parents set languages = 'hi,en' where id = 'parent_kamla'`);
    const low = await sendDailyBriefing("parent_kamla", {
      id: `quote_hi_${Date.now()}`,
      mood_quote: "  ",
      mood: "low",
      status: "completed",
    });
    assert.equal(low.ok, true);
    const hiEntry = mockLoggedWhatsapp.find((row) => row.name === "daily_briefing_low_mood");
    assert.ok(hiEntry);
    assert.equal(whatsappVarsAreSafe(hiEntry!.vars), true);
    assert.equal(hiEntry!.vars.at(-1), "आज कोई बात दर्ज नहीं हुई");
    for (const entry of mockLoggedWhatsapp) {
      assert.equal(whatsappVarsAreSafe(entry.vars), true);
    }
  });
});
