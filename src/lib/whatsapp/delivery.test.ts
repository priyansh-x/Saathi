import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "../db/client";
import { seed } from "../db/seed";
import { loadOpsSnapshot } from "../ops/snapshot";
import { nowIstStamp } from "../time";
import {
  applyWhatsappStatuses,
  escalateUndeliveredAlerts,
  formatDeliveryClock,
  formatDeliveryLine,
  latestDeliveryLine,
  parseWhatsappStatuses,
} from "./delivery";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

function statusPayload(id: string, status: string, timestamp = "1760781720") {
  return JSON.stringify({
    object: "whatsapp_business_account",
    entry: [
      {
        changes: [
          {
            value: {
              statuses: [{ id, status, timestamp, recipient_id: "+910000000001" }],
            },
          },
        ],
      },
    ],
  });
}

describe("WhatsApp delivery statuses", () => {
  it("parses Meta status webhooks", () => {
    const rows = parseWhatsappStatuses(statusPayload("wamid.EXAMPLE.1", "delivered"));
    assert.equal(rows[0]?.id, "wamid.EXAMPLE.1");
    assert.equal(rows[0]?.status, "delivered");
    assert.deepEqual(parseWhatsappStatuses("not-json"), []);
  });

  it("stores sent/delivered/read/failed on the outbound row by wamid", async () => {
    const wamid = `wamid.EXAMPLE.del_${Date.now()}`;
    await query(
      `insert into outbound_messages (
        id, parent_id, channel, template, to_phone, body, at, status, is_example,
        provider_message_id, delivery_status, delivery_at
      ) values ($1,$2,'whatsapp','daily_briefing_good','+910000000001','EXAMPLE body',$3,'sent',true,$4,'sent',$3)`,
      [`out_del_${Date.now()}`, "parent_kamla", "2026-10-18T08:40:00+05:30", wamid],
    );
    const applied = await applyWhatsappStatuses(parseWhatsappStatuses(statusPayload(wamid, "delivered", "1760782320")));
    assert.equal(applied.length, 1);
    const row = await query<{ delivery_status: string; delivery_at: string }>(
      `select delivery_status, delivery_at from outbound_messages where provider_message_id = $1`,
      [wamid],
    );
    assert.equal(row[0]?.delivery_status, "delivered");
    assert.match(row[0]?.delivery_at ?? "", /\+05:30$/);
    await applyWhatsappStatuses([{ id: wamid, status: "read", timestamp: "1760782380" }]);
    const read = await query<{ delivery_status: string }>(
      `select delivery_status from outbound_messages where provider_message_id = $1`,
      [wamid],
    );
    assert.equal(read[0]?.delivery_status, "read");
    await applyWhatsappStatuses([{ id: wamid, status: "failed" }]);
    const failed = await query<{ delivery_status: string }>(
      `select delivery_status from outbound_messages where provider_message_id = $1`,
      [wamid],
    );
    assert.equal(failed[0]?.delivery_status, "read");
  });

  it("does not let a late sent overwrite delivered or read", async () => {
    const wamid = `wamid.EXAMPLE.order_${Date.now()}`;
    await query(
      `insert into outbound_messages (
        id, parent_id, channel, template, to_phone, body, at, status, is_example,
        provider_message_id, delivery_status, delivery_at
      ) values ($1,$2,'whatsapp','daily_briefing_good','+910000000001','EXAMPLE body',$3,'sent',true,$4,'delivered',$3)`,
      [`out_order_${Date.now()}`, "parent_kamla", "2026-10-18T08:40:00+05:30", wamid],
    );
    await applyWhatsappStatuses([{ id: wamid, status: "sent", timestamp: "1760782000" }]);
    const row = await query<{ delivery_status: string }>(
      `select delivery_status from outbound_messages where provider_message_id = $1`,
      [wamid],
    );
    assert.equal(row[0]?.delivery_status, "delivered");
  });

  it("formats the desk line as Delivered to Rohit 8:42", async () => {
    assert.equal(formatDeliveryClock("2026-10-18T08:42:00+05:30"), "8:42");
    assert.equal(formatDeliveryLine("Rohit", "8:42"), "Delivered to Rohit 8:42");
    await query(`delete from outbound_messages where id = 'out_desk_line'`);
    await query(
      `insert into outbound_messages (
        id, parent_id, channel, template, to_phone, body, at, status, is_example,
        provider_message_id, delivery_status, delivery_at
      ) values ('out_desk_line','parent_kamla','whatsapp','daily_briefing_good','+910000000001','EXAMPLE',
        '2026-10-18T08:42:00+05:30','sent',true,'wamid.EXAMPLE.desk','delivered','2026-10-18T08:42:00+05:30')`,
    );
    assert.equal(await latestDeliveryLine("parent_kamla"), "Delivered to Rohit 8:42");
  });

  it("tries the next ladder person if an alert is not delivered in 5 minutes", async () => {
    const id = `out_safety_alert_emergency_late_${Date.now()}`;
    const at = nowIstStamp(new Date(Date.now() - 6 * 60 * 1000));
    await query(
      `insert into outbound_messages (
        id, parent_id, channel, template, to_phone, body, at, status, is_example,
        provider_message_id, delivery_status, delivery_at
      ) values ($1,'parent_kamla','whatsapp','safety_alert_emergency','+910000000001','EXAMPLE alert',$2,'sent',true,
        $3,'sent',$2)`,
      [id, at, `wamid.EXAMPLE.${id}`],
    );
    const sent = await escalateUndeliveredAlerts(new Date());
    assert.ok(sent.some((row) => row.ok && row.channel === "whatsapp"));
    const next = await query<{ to_phone: string; template: string }>(
      `select to_phone, template from outbound_messages where id like $1`,
      [`%esc_${id}%`],
    );
    assert.ok(next[0]);
    assert.match(next[0]!.to_phone.replace(/\D/g, ""), /0000000002$/);
    assert.equal(next[0]!.template, "safety_alert_emergency");
  });

  it("does not escalate a delivered alert or send twice", async () => {
    const id = `out_safety_alert_emergency_ok_${Date.now()}`;
    const at = nowIstStamp(new Date(Date.now() - 10 * 60 * 1000));
    await query(
      `insert into outbound_messages (
        id, parent_id, channel, template, to_phone, body, at, status, is_example,
        provider_message_id, delivery_status, delivery_at
      ) values ($1,'parent_kamla','whatsapp','safety_alert_emergency','+910000000001','EXAMPLE ok',$2,'sent',true,
        $3,'delivered',$2)`,
      [id, at, `wamid.EXAMPLE.${id}`],
    );
    const before = await query<{ n: number }>(`select count(*)::int as n from outbound_messages`);
    await escalateUndeliveredAlerts(new Date());
    const after = await query<{ n: number }>(`select count(*)::int as n from outbound_messages`);
    assert.equal(after[0]?.n, before[0]?.n);

    const lateId = `out_safety_alert_emergency_once_${Date.now()}`;
    await query(
      `insert into outbound_messages (
        id, parent_id, channel, template, to_phone, body, at, status, is_example,
        provider_message_id, delivery_status, delivery_at
      ) values ($1,'parent_kamla','whatsapp','safety_alert_emergency','+910000000001','EXAMPLE late',$2,'sent',true,
        $3,'failed',$2)`,
      [lateId, at, `wamid.EXAMPLE.${lateId}`],
    );
    await escalateUndeliveredAlerts(new Date());
    await escalateUndeliveredAlerts(new Date());
    const copies = await query<{ n: number }>(
      `select count(*)::int as n from outbound_messages where id like $1`,
      [`%esc_${lateId}%`],
    );
    assert.equal(copies[0]?.n, 1);
  });

  it("walks child, other family, then opted-in neighbour without repeating", async () => {
    await query(`delete from contacts where id = 'contact_priya'`);
    await query(`insert into contacts values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [
      "contact_priya",
      "parent_kamla",
      "child",
      "Priya Sharma",
      "Priya",
      "+910000000003",
      "en",
      true,
      "priya@example.invalid",
    ]);
    const id = `out_safety_alert_emergency_ladder_${Date.now()}`;
    const at = nowIstStamp(new Date(Date.now() - 6 * 60 * 1000));
    await query(
      `insert into outbound_messages (
        id, parent_id, channel, template, to_phone, body, at, status, is_example,
        provider_message_id, delivery_status, delivery_at
      ) values ($1,'parent_kamla','whatsapp','safety_alert_emergency','+910000000001','EXAMPLE ladder',$2,'sent',true,
        $3,'sent',$2)`,
      [id, at, `wamid.EXAMPLE.${id}`],
    );
    await escalateUndeliveredAlerts(new Date());
    await escalateUndeliveredAlerts(new Date());
    await escalateUndeliveredAlerts(new Date());
    const hops = await query<{ to_phone: string }>(
      `select to_phone from outbound_messages where id like $1 order by at, id`,
      [`%esc_${id}%`],
    );
    assert.equal(hops.length, 2);
    assert.match(hops[0]!.to_phone.replace(/\D/g, ""), /0000000003$/);
    assert.match(hops[1]!.to_phone.replace(/\D/g, ""), /0000000002$/);
    await query(`delete from contacts where id = 'contact_priya'`);
  });

  it("skips a neighbour who has not opted in", async () => {
    await query(`update consents set granted = false where id = 'con_neighbour'`);
    await query(`delete from contacts where id = 'contact_priya'`);
    await query(`insert into contacts values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [
      "contact_priya",
      "parent_kamla",
      "child",
      "Priya Sharma",
      "Priya",
      "+910000000003",
      "en",
      true,
      "priya@example.invalid",
    ]);
    const id = `out_safety_alert_emergency_optin_${Date.now()}`;
    const at = nowIstStamp(new Date(Date.now() - 6 * 60 * 1000));
    await query(
      `insert into outbound_messages (
        id, parent_id, channel, template, to_phone, body, at, status, is_example,
        provider_message_id, delivery_status, delivery_at
      ) values ($1,'parent_kamla','whatsapp','safety_alert_emergency','+910000000001','EXAMPLE optin',$2,'sent',true,
        $3,'sent',$2)`,
      [id, at, `wamid.EXAMPLE.${id}`],
    );
    await escalateUndeliveredAlerts(new Date());
    await escalateUndeliveredAlerts(new Date());
    const hops = await query<{ to_phone: string }>(
      `select to_phone from outbound_messages where id like $1 order by at, id`,
      [`%esc_${id}%`],
    );
    assert.equal(hops.length, 1);
    assert.match(hops[0]!.to_phone.replace(/\D/g, ""), /0000000003$/);
    assert.doesNotMatch(hops[0]!.to_phone.replace(/\D/g, ""), /0000000002$/);
    await query(`update consents set granted = true where id = 'con_neighbour'`);
    await query(`delete from contacts where id = 'contact_priya'`);
  });

  it("stops the ladder once the alert is acknowledged", async () => {
    const alertId = `alert_ack_stop_${Date.now()}`;
    await query(`insert into alerts values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [
      alertId,
      "parent_kamla",
      null,
      "EMERGENCY",
      "act",
      "Bathroom mein gir gayi, uth nahi pa rahi.",
      nowIstStamp(),
      nowIstStamp(),
      "Rohit",
      null,
      false,
      "test",
      true,
    ]);
    const id = `out_safety_alert_emergency_${alertId}`;
    const at = nowIstStamp(new Date(Date.now() - 6 * 60 * 1000));
    await query(
      `insert into outbound_messages (
        id, parent_id, channel, template, to_phone, body, at, status, is_example,
        provider_message_id, delivery_status, delivery_at
      ) values ($1,'parent_kamla','whatsapp','safety_alert_emergency','+910000000001','EXAMPLE acked',$2,'sent',true,
        $3,'sent',$2)`,
      [id, at, `wamid.EXAMPLE.${id}`],
    );
    await escalateUndeliveredAlerts(new Date());
    const hops = await query<{ n: number }>(
      `select count(*)::int as n from outbound_messages where id like $1`,
      [`%esc_${id}%`],
    );
    assert.equal(hops[0]?.n, 0);
  });

  it("fills alert variables from the parent record, not a hard-coded Maa", async () => {
    await query(`update parents set address_term = 'Amma' where id = 'parent_kamla'`);
    const id = `out_safety_alert_emergency_vars_${Date.now()}`;
    const at = nowIstStamp(new Date(Date.now() - 6 * 60 * 1000));
    await query(
      `insert into outbound_messages (
        id, parent_id, channel, template, to_phone, body, at, status, is_example,
        provider_message_id, delivery_status, delivery_at
      ) values ($1,'parent_kamla','whatsapp','safety_alert_emergency','+910000000001','EXAMPLE vars',$2,'sent',true,
        $3,'sent',$2)`,
      [id, at, `wamid.EXAMPLE.${id}`],
    );
    await escalateUndeliveredAlerts(new Date());
    const hop = await query<{ body: string }>(`select body from outbound_messages where id like $1`, [`%esc_${id}%`]);
    assert.match(hop[0]?.body ?? "", /Amma/);
    assert.doesNotMatch(hop[0]?.body ?? "", /hard-coded/);
    await query(`update parents set address_term = 'Maa' where id = 'parent_kamla'`);
  });

  it("does not escalate an escalation row", async () => {
    const id = `out_safety_alert_emergency_esc_already_${Date.now()}`;
    const at = nowIstStamp(new Date(Date.now() - 6 * 60 * 1000));
    await query(
      `insert into outbound_messages (
        id, parent_id, channel, template, to_phone, body, at, status, is_example,
        provider_message_id, delivery_status, delivery_at
      ) values ($1,'parent_kamla','whatsapp','safety_alert_emergency','+910000000002','EXAMPLE esc',$2,'sent',true,
        $3,'failed',$2)`,
      [id, at, `wamid.EXAMPLE.${id}`],
    );
    const before = await query<{ n: number }>(`select count(*)::int as n from outbound_messages`);
    await escalateUndeliveredAlerts(new Date());
    const after = await query<{ n: number }>(`select count(*)::int as n from outbound_messages`);
    assert.equal(after[0]?.n, before[0]?.n);
  });

  it("shows delivery on /ops without raw phones", async () => {
    const snap = await loadOpsSnapshot();
    const blob = JSON.stringify(snap);
    assert.doesNotMatch(blob, /\+91[0-9]{10}/);
    assert.ok(snap.outbound.some((row) => row.delivery === "delivered" || row.delivery === "mock"));
    for (const row of snap.outbound) {
      assert.equal("delivery" in row, true);
    }
  });
});
