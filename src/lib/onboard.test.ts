import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { placeMorningCall } from "./bolna/place";
import { closeDb, query } from "./db/client";
import { parentByToken } from "./db/queries";
import { seed } from "./db/seed";
import { CHILD_WRITTEN_TEXT, CHILD_WRITTEN_VERSION } from "./consent-copy";
import { createHousehold, resolveOnboardEmail } from "./onboard";
import { parseOnboard, type OnboardInput } from "./onboard-form";
import { toE164 } from "./phone";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";
process.env.ALLOWED_PHONE_NUMBERS = "";

const valid: OnboardInput = {
  childName: "Ananya Joshi",
  childWhatsapp: "+910000000008",
  parentName: "Leela Joshi",
  addressTerm: "Aai",
  parentPhone: "+910000000006",
  city: "Pune",
  languages: ["mr", "hi"],
  callTime: "08:30",
  medicines: [{ name: "BP wali goli", time: "08:30", withFood: true }],
  neighborName: "Rekha",
  neighborPhone: "+910000000010",
  toldParent: true,
};

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("resolveOnboardEmail", () => {
  it("prefers a valid session email", () => {
    assert.equal(resolveOnboardEmail("Ananya@Example.com", "other@example.com"), "ananya@example.com");
  });

  it("uses the body email when there is no session", () => {
    assert.equal(resolveOnboardEmail(undefined, "Ananya@Example.com"), "ananya@example.com");
  });

  it("rejects junk", () => {
    assert.equal(resolveOnboardEmail(undefined, "not-an-email"), null);
    assert.equal(resolveOnboardEmail("nope", ""), null);
  });
});

describe("onboard validation", () => {
  it("writes E.164 and rejects a bad phone", () => {
    assert.equal(toE164("+910000000006"), "+910000000006");
    assert.equal(toE164("123"), null);
    const bad = parseOnboard({ ...valid, parentPhone: "123" });
    assert.equal(bad.ok, false);
    if (!bad.ok) assert.match(bad.error, /10-digit|\+91/);
    const good = parseOnboard(valid);
    assert.equal(good.ok, true);
    if (good.ok) assert.equal(good.data.parentPhone, "+910000000006");
  });

  it("blocks finishing without the written consent box", () => {
    const missing = parseOnboard({ ...valid, toldParent: false });
    assert.equal(missing.ok, false);
    if (!missing.ok) assert.match(missing.error, /must not be a surprise/);
  });
});

describe("createHousehold", () => {
  it("happy path: pending, not EXAMPLE, E.164, consent record, empty today", async () => {
    const created = await createHousehold(valid, "ananya@example.com");
    const parent = await parentByToken(created.token);
    assert.ok(parent);
    assert.equal(parent?.is_example, false);
    assert.equal(parent?.consent_status, "pending");
    assert.equal(parent?.address_term, "Aai");
    assert.equal(parent?.phone, "+910000000006");
    assert.equal(parent?.call_time, "08:30");
    const child = await query<{ email: string; phone: string }>(
      `select email, phone from contacts where parent_id = $1 and role = 'child'`,
      [created.parentId],
    );
    assert.equal(child[0]?.email, "ananya@example.com");
    assert.equal(child[0]?.phone, "+910000000008");
    const consent = await query<{ evidence: string }>(
      `select evidence from consents where parent_id = $1 and kind = 'child_written'`,
      [created.parentId],
    );
    const evidence = JSON.parse(consent[0]?.evidence || "{}") as {
      version: string;
      who: string;
      who_email: string;
      text: string;
    };
    assert.equal(evidence.version, CHILD_WRITTEN_VERSION);
    assert.equal(evidence.who, "Ananya Joshi");
    assert.equal(evidence.who_email, "ananya@example.com");
    assert.equal(evidence.text, CHILD_WRITTEN_TEXT);
    const calls = await query<{ n: number }>(`select count(*)::int as n from calls where parent_id = $1`, [
      created.parentId,
    ]);
    assert.equal(calls[0]?.n, 0);
    const placed = await placeMorningCall(created.parentId);
    assert.equal(placed.ok, false);
    if (!placed.ok) assert.equal(placed.reason, "not_allowlisted");
  });

  it("places a simulated morning call once the number is allowlisted", async () => {
    const prev = process.env.ALLOWED_PHONE_NUMBERS;
    const parentPhone = "+910000000026";
    process.env.ALLOWED_PHONE_NUMBERS = parentPhone;
    try {
      const created = await createHousehold(
        { ...valid, parentPhone, childWhatsapp: "+910000000027", neighborName: "", neighborPhone: "" },
        "allowlist@example.com",
      );
      const placed = await placeMorningCall(created.parentId);
      assert.equal(placed.ok, true);
      if (placed.ok) assert.equal(placed.mock, true);
    } finally {
      process.env.ALLOWED_PHONE_NUMBERS = prev;
    }
  });

  it("throws when consent is missing", async () => {
    await assert.rejects(() => createHousehold({ ...valid, toldParent: false, parentPhone: "+910000000016" }, "a@b.co"), /surprise/);
  });
});
