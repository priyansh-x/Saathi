import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { extractSystemPrompt } from "./agent-config";
import {
  assertContextCoversPrompt,
  buildCallContext,
  extractPromptPlaceholders,
  loadSystemPromptPlaceholders,
  medicineNameWithDose,
  medicinesDueTodayText,
} from "./call-context";
import { closeDb } from "../db/client";
import { seed } from "../db/seed";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("buildCallContext", () => {
  it("covers every {placeholder} in the Bolna system prompt", async () => {
    const md = readFileSync(path.join(process.cwd(), "docs/saathi/voice/system_prompt_bolna.md"), "utf8");
    const prompt = extractSystemPrompt(md);
    const placeholders = extractPromptPlaceholders(prompt);
    assert.deepEqual(placeholders, loadSystemPromptPlaceholders());
    assert.ok(placeholders.includes("parent_name"));
    assert.ok(placeholders.includes("consent_line_hi"));
    assert.ok(placeholders.includes("medicines"));

    const ctx = await buildCallContext("parent_kamla");
    assert.doesNotThrow(() => assertContextCoversPrompt(prompt, ctx));
    for (const name of placeholders) {
      assert.equal(typeof ctx[name], "string", `missing ${name}`);
    }

    const stripped = { ...ctx };
    delete stripped.parent_name;
    assert.throws(() => assertContextCoversPrompt(prompt, stripped), /parent_name/);
  });

  it("fills names, address term, language, due medicines, memory, consent, and neighbour", async () => {
    const ctx = await buildCallContext("parent_kamla");
    assert.equal(ctx.parent_name, "Kamla");
    assert.equal(ctx.address_term, "Maa");
    assert.equal(ctx.preferred_language, "Hindi");
    assert.equal(ctx.child_name, "Rohit");
    assert.match(ctx.medicines_due_today, /Amlodipine/);
    assert.equal(ctx.medicines_due_today.includes("\n"), false);
    assert.equal(ctx.consent_state, "given");
    assert.equal(ctx.neighbour_present, "yes");
    assert.match(ctx.consent_line_en, /Sunita/);
    assert.equal(ctx.call_memory, ctx.last_call_summary);
    assert.equal(Object.values(ctx).every((v) => typeof v === "string"), true);
  });
});

describe("medicineNameWithDose", () => {
  it("omits empty brackets when dose is blank", () => {
    assert.equal(medicineNameWithDose("Telma 40", ""), "Telma 40");
    assert.equal(medicineNameWithDose("Telma 40", "   "), "Telma 40");
    assert.equal(medicineNameWithDose("Telma 40", "BP ki goli"), "Telma 40 (BP ki goli)");
    assert.match(
      medicinesDueTodayText([
        {
          id: "med_telma",
          name: "Telma 40",
          dose: "",
          appearance: "",
          meal: "subah",
          time_local: "08:00",
        },
      ]),
      /Telma 40 \|/,
    );
    assert.equal(
      medicinesDueTodayText([
        {
          id: "med_telma",
          name: "Telma 40",
          dose: "",
          appearance: "",
          meal: "subah",
          time_local: "08:00",
        },
      ]).includes("()"),
      false,
    );
  });
});
