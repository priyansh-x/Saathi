import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { closeDb, query } from "./db/client";
import { seed } from "./db/seed";
import { runDailyTick } from "./cron/tick";
import { inSundayEveningWindow, istDayKey, istDayOffset, istWeekMonday, istWeekSunday } from "./time";
import { buildWeeklyNote, sendSundayWeeklyNotes, sendWeeklyNote } from "./weekly";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.SAATHI_KILL_SWITCH = "0";
process.env.WHATSAPP_TEMPLATES_APPROVED = "1";

/** Sunday 18 Oct 2026, 18:30 IST. */
const SUNDAY_EVENING = new Date("2026-10-18T13:00:00.000Z");
/** Saturday 17 Oct 2026, 08:30 IST. */
const SATURDAY_MORNING = new Date("2026-10-17T03:00:00.000Z");

/** Sunday 18:30 IST of the latest seeded week (current week if today is Sunday). */
function seededSundayEvening(from = new Date()) {
  const thisSunday = istWeekSunday(from);
  const sunday = istDayKey(from) === thisSunday ? thisSunday : istDayOffset(-7, new Date(`${thisSunday}T12:00:00+05:30`));
  return { sunday, now: new Date(`${sunday}T18:30:00+05:30`) };
}

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

describe("weekly note", () => {
  it("uses Mon–Sun IST weeks and Sunday evening from 18:00", () => {
    assert.equal(istWeekMonday(SUNDAY_EVENING), "2026-10-12");
    assert.equal(istWeekSunday(SUNDAY_EVENING), "2026-10-18");
    assert.equal(istWeekMonday(SATURDAY_MORNING), "2026-10-12");
    assert.equal(inSundayEveningWindow(SUNDAY_EVENING), true);
    assert.equal(inSundayEveningWindow(SATURDAY_MORNING), false);
    assert.equal(inSundayEveningWindow(new Date("2026-10-18T12:20:00.000Z")), false);
  });

  it("counts answered calls, doses, alerts, and a post-consent line in her words", async () => {
    await seed();
    const { now } = seededSundayEvening();
    const note = await buildWeeklyNote("parent_kamla", now);
    assert.ok(note);
    assert.ok((note?.answered ?? -1) >= 1);
    assert.ok((note?.answered ?? 9) <= 7);
    assert.equal(note?.dosesExpected, 14);
    assert.ok(note?.quote);
    assert.match(note?.bodyEn ?? "", /answered \d+ of 7 calls/);
    assert.match(note?.bodyEn ?? "", /took \d+ of 14 doses/);
    assert.match(note?.notableEn ?? "", /alert/i);
    assert.match(note?.bodyEn ?? "", /Maa's week/);
  });

  it("omits her words when first-call consent is not given", async () => {
    await seed();
    await query(`update parents set consent_status = 'pending', consent_at = null where id = 'parent_kamla'`);
    const { now } = seededSundayEvening();
    const note = await buildWeeklyNote("parent_kamla", now);
    assert.equal(note?.quote, null);
    assert.equal((note?.notableEn ?? "").includes("Seene"), false);
    await query(
      `update parents set consent_status = 'given', consent_at = '2026-10-10T08:12:00+05:30' where id = 'parent_kamla'`,
    );
  });

  it("sends a mocked WhatsApp weekly note once per child per week", async () => {
    await seed();
    const { now } = seededSundayEvening();
    const first = await sendWeeklyNote("parent_kamla", now);
    assert.equal(first.ok, true);
    const rows = await query<{ template: string; status: string; body: string }>(
      `select template, status, body from outbound_messages
       where parent_id = 'parent_kamla' and template = 'weekly_summary' and status = 'mock'`,
    );
    assert.equal(rows.length, 1);
    assert.match(rows[0]?.body ?? "", /Maa's week/);
    const second = await sendWeeklyNote("parent_kamla", now);
    assert.equal(second.ok, true);
    if (second.ok) assert.equal(second.results[0]?.status, "duplicate");
  });

  it("does not send before Sunday evening, and skips paused families", async () => {
    await seed();
    const early = await sendSundayWeeklyNotes(SATURDAY_MORNING);
    assert.equal(early.skipped, "not_sunday_evening");
    await query(`update parents set paused = true where id = 'parent_kamla'`);
    const { now } = seededSundayEvening();
    const paused = await sendWeeklyNote("parent_kamla", now);
    assert.equal(paused.ok, false);
    if (!paused.ok) assert.equal(paused.skipped, "paused");
    await query(`update parents set paused = false where id = 'parent_kamla'`);
  });

  it("Sunday evening tick logs the weekly note without placing a second morning call", async () => {
    await seed();
    const { sunday, now } = seededSundayEvening();
    const before = await query<{ n: number }>(
      `select count(*)::int as n from calls where parent_id = 'parent_kamla' and started_at like $1`,
      [`${sunday}%`],
    );
    const tick = await runDailyTick({ now });
    assert.equal(tick.ok, true);
    if (tick.ok) {
      const kamla = tick.results.find((r) => r.parent_id === "parent_kamla");
      assert.ok(kamla && "skipped" in kamla);
    }
    const after = await query<{ n: number }>(
      `select count(*)::int as n from calls where parent_id = 'parent_kamla' and started_at like $1`,
      [`${sunday}%`],
    );
    assert.equal(after[0]?.n, before[0]?.n);
    const weekly = await query<{ n: number }>(
      `select count(*)::int as n from outbound_messages
       where parent_id = 'parent_kamla' and template = 'weekly_summary' and status = 'mock'`,
    );
    assert.equal(weekly[0]?.n, 1);
  });
});
