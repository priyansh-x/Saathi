/**
 * Print the Graph payload for one WhatsApp template. Does not send unless
 * Priyansh passes --yes with MOCK_WHATSAPP=0, an allowlisted number, and an
 * approved template. Agents never set those flags and never pass --yes.
 *
 * Usage: npm run whatsapp:test-send -- +91XXXXXXXXXX briefing
 */
import {
  canSendTestWhatsapp,
  parseTestSendArgs,
  plannedTestSend,
} from "../../src/lib/whatsapp/test-send-cli";

async function main() {
  const { yes, phone, templateArg } = parseTestSendArgs(process.argv.slice(2));
  const live = canSendTestWhatsapp(phone, templateArg, yes);
  const plan = plannedTestSend(phone, templateArg || "briefing");
  if (!live.ok) {
    console.log(
      JSON.stringify(
        {
          dry_run: true,
          reason: live.reason,
          yes,
          phone: phone || null,
          template_arg: templateArg || null,
          url: plan.url,
          payload: plan.payload,
          example: true,
          allowlisted: plan.allowlisted,
          approved: plan.approved,
        },
        null,
        2,
      ),
    );
    return;
  }

  const { closeDb, query } = await import("../../src/lib/db/client");
  const { ensureSeed } = await import("../../src/lib/db/seed");
  const { sendFamilyMessage } = await import("../../src/lib/whatsapp/send");
  await ensureSeed();
  const digits = live.to.replace(/\D/g, "").slice(-10);
  const contacts = await query<{ parent_id: string }>(
    `select parent_id from contacts where regexp_replace(phone, '[^0-9]', '', 'g') like $1 limit 1`,
    [`%${digits}`],
  );
  const parentId = contacts[0]?.parent_id;
  if (!parentId) {
    console.error(JSON.stringify({ ok: false, reason: "no_parent_for_number", example: true }));
    await closeDb();
    process.exit(1);
  }
  const result = await sendFamilyMessage({
    parentId,
    toPhone: live.to,
    locale: "en",
    intended: live.template,
    vars: plan.vars,
    idempotencyKey: `test_send_${Date.now()}`,
  });
  console.log(JSON.stringify({ ok: result.ok, status: result.status, channel: result.channel, example: true }, null, 2));
  await closeDb();
  if (!result.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
