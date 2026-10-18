/**
 * Print the Meta template pack. Does not submit anything.
 * npm run whatsapp:templates
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import {
  assertTemplatePack,
  formatTemplatesForMeta,
  whatsappTemplatePack,
} from "../../src/lib/whatsapp/template-pack";

const pack = whatsappTemplatePack();
assertTemplatePack(pack);
writeFileSync(path.join(process.cwd(), "scripts/whatsapp/templates.json"), `${JSON.stringify(pack, null, 2)}\n`);
console.log(formatTemplatesForMeta(pack));
