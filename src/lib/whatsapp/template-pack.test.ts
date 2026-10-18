import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  assertTemplatePack,
  bodyVariables,
  formatTemplatesForMeta,
  whatsappTemplatePack,
  type WhatsappTemplate,
} from "./template-pack";

describe("WhatsApp template pack", () => {
  it("has continuous variables, examples, length cap, and matching en/hi vars", () => {
    const pack = whatsappTemplatePack();
    assert.doesNotThrow(() => assertTemplatePack(pack));
    const snapshot = JSON.parse(
      readFileSync(path.join(process.cwd(), "scripts/whatsapp/templates.json"), "utf8"),
    ) as WhatsappTemplate[];
    assert.deepEqual(snapshot, pack);
    for (const tpl of pack) {
      const vars = bodyVariables(tpl.body);
      assert.equal(vars[0], 1);
      assert.equal(vars.length, tpl.examples.length);
      assert.ok(tpl.body.length <= 1024);
    }
    const paste = formatTemplatesForMeta(pack);
    assert.match(paste, /Do not submit/);
    assert.match(paste, /EXAMPLE/);
  });
});
