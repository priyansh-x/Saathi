import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";
import { familyConsentRecord } from "@/lib/consent-export";
import { canDeleteFamily } from "@/lib/members";
import { privacyCopy } from "@/lib/privacy-copy";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("privacy copy", () => {
  it("is a DRAFT in EN and हिं, with retention and 112", () => {
    const en = privacyCopy("en");
    const hi = privacyCopy("hi");
    assert.match(en.draft, /DRAFT/i);
    assert.match(hi.draft, /मसौदा/);
    const blob = `${en.lead} ${en.sections.map((s) => s.body).join(" ")}`;
    assert.match(blob, /112/);
    assert.match(blob, /not an emergency service/i);
    assert.match(blob, /30 days/);
    assert.match(blob, /90 days/);
    assert.match(hi.lead, /112/);
  });
});

describe("consent export", () => {
  it("exports who, when, and text version, and nothing from calls", async () => {
    const record = await familyConsentRecord("parent_kamla");
    assert.equal(record.kind, "saathi_consent_record");
    assert.match(record.exported_at, /\+05:30$/);
    assert.ok(record.consents.some((c) => c.who === "child_written" && c.text_version && c.text));
    const blob = JSON.stringify(record);
    assert.doesNotMatch(blob, /transcript/i);
    assert.doesNotMatch(blob, /Namaste Kamla/);
    assert.doesNotMatch(blob, /summary_en/);
  });

  it("only the owner can download the consent record", async () => {
    assert.equal(await canDeleteFamily("parent_kamla", "rohit@example.invalid"), true);
    assert.equal(await canDeleteFamily("parent_kamla", "visitor@example.com"), false);
  });
});
