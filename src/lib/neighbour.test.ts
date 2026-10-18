import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "./db/client";
import { seed } from "./db/seed";
import { createHousehold } from "./onboard";
import type { OnboardInput } from "./onboard-form";
import { neighbourOptedIn } from "./neighbour";
import { notifyAlert } from "./whatsapp/notify";
import { fixtureButtonMessage, parseWhatsappWebhookJson, processInboundMessages } from "./whatsapp/inbound";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";
process.env.WHATSAPP_TEMPLATES_APPROVED = "1";

const family: OnboardInput = {
  childName: "Ananya Joshi",
  childWhatsapp: "9876500011",
  parentName: "Leela Joshi",
  addressTerm: "Aai",
  parentPhone: "9810000111",
  city: "Pune",
  languages: ["mr"],
  callTime: "08:30",
  medicines: [],
  neighborName: "Rekha",
  neighborPhone: "9822000111",
  toldParent: true,
};

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("neighbour opt-in", () => {
  it("asks yes/no, stays off the ladder until yes, and records no", async () => {
    const created = await createHousehold(family, "ananya@example.com");
    assert.equal(await neighbourOptedIn(created.parentId), false);
    const optins = await query<{ template: string; body: string }>(
      `select template, body from outbound_messages where parent_id = $1 and template like 'responder_optin%'`,
      [created.parentId],
    );
    assert.equal(optins.length, 1);
    assert.match(optins[0]?.body || "", /Will you help if Leela doesn't answer|फ़ोन न उठाएँ/);

    const beforeYes = await notifyAlert(created.parentId, {
      id: "n_alert_1",
      quote: "No answer",
      created_at: "2026-10-18T08:33:00+05:30",
    });
    void beforeYes;
    const respondersBefore = await query<{ n: number }>(
      `select count(*)::int as n from outbound_messages where parent_id = $1 and template like 'responder_%' and template not like 'responder_optin%'`,
      [created.parentId],
    );
    assert.equal(respondersBefore[0]?.n, 0);

    const yes = parseWhatsappWebhookJson(
      JSON.stringify(fixtureButtonMessage({ from: "919822000111", title: "Yes", payload: "neighbour_yes" })),
    );
    assert.equal(yes.ok, true);
    if (yes.ok) await processInboundMessages(yes.messages);
    assert.equal(await neighbourOptedIn(created.parentId), true);

    await notifyAlert(created.parentId, {
      id: "n_alert_2",
      quote: "No answer",
      created_at: "2026-10-18T08:40:00+05:30",
    });
    const respondersAfter = await query<{ n: number }>(
      `select count(*)::int as n from outbound_messages where parent_id = $1 and template like 'responder_en' or parent_id = $1 and template like 'responder_hi'`,
      [created.parentId],
    );
    assert.ok((respondersAfter[0]?.n ?? 0) >= 1);

    const other = await createHousehold(
      { ...family, parentPhone: "9810000222", childWhatsapp: "9876500022", neighborPhone: "9822000222" },
      "ananya2@example.com",
    );
    const no = parseWhatsappWebhookJson(
      JSON.stringify(fixtureButtonMessage({ from: "919822000222", title: "No", payload: "neighbour_no" })),
    );
    assert.equal(no.ok, true);
    if (no.ok) await processInboundMessages(no.messages);
    assert.equal(await neighbourOptedIn(other.parentId), false);
  });
});
