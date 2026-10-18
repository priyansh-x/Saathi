import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { auditsFor } from "./audit";
import { closeDb, query } from "./db/client";
import { seed } from "./db/seed";
import {
  addMedicine,
  editMedicine,
  removeMedicine,
  updateCallTime,
  updateLanguages,
  updateNeighbour,
  updatePaused,
} from "./settings";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

function lastAction(rows: { what: string }[]) {
  return JSON.parse(rows[0]?.what || "{}") as { action?: string; after?: unknown; before?: unknown };
}

describe("family settings", () => {
  it("changes call time, languages, neighbour, medicines and pause, and writes audit rows", async () => {
    await updateCallTime("parent_kamla", "09:00", "Rohit");
    const parent = await query<{ call_time: string; languages: string; paused: boolean }>(
      `select call_time, languages, paused from parents where id = 'parent_kamla'`,
    );
    assert.equal(parent[0]?.call_time, "09:00");

    await updateLanguages("parent_kamla", ["hi", "mr"], "Rohit");
    const langs = await query<{ languages: string }>(`select languages from parents where id = 'parent_kamla'`);
    assert.equal(langs[0]?.languages, "hi,mr,en");

    await updateNeighbour("parent_kamla", { name: "Kavita", phone: "9811177822" }, "Rohit");
    const neighbour = await query<{ full_name: string; phone: string }>(
      `select full_name, phone from contacts where parent_id = 'parent_kamla' and role = 'neighbour'`,
    );
    assert.equal(neighbour[0]?.full_name, "Kavita");
    assert.equal(neighbour[0]?.phone, "+919811177822");

    const added = await addMedicine("parent_kamla", { name: "Calcium", time: "20:30", meal: "with food" }, "Rohit");
    await editMedicine("parent_kamla", added.id, { name: "Calcium", time: "21:00", meal: "without food" }, "Rohit");
    const med = await query<{ meal: string }>(`select meal from medicines where id = $1`, [added.id]);
    assert.equal(med[0]?.meal, "without food");
    const sch = await query<{ time_local: string }>(`select time_local from schedules where medicine_id = $1`, [added.id]);
    assert.equal(sch[0]?.time_local, "21:00");
    await removeMedicine("parent_kamla", added.id, "Rohit");
    const gone = await query<{ n: number }>(`select count(*)::int as n from medicines where id = $1`, [added.id]);
    assert.equal(gone[0]?.n, 0);

    await updatePaused("parent_kamla", true, "Rohit");
    const paused = await query<{ paused: boolean }>(`select paused from parents where id = 'parent_kamla'`);
    assert.equal(paused[0]?.paused, true);
    await updatePaused("parent_kamla", false, "Rohit");

    const audits = await auditsFor("parent_kamla");
    const actions = audits.map((row) => lastAction([row]).action);
    assert.ok(actions.includes("call_time"));
    assert.ok(actions.includes("languages"));
    assert.ok(actions.includes("neighbour"));
    assert.ok(actions.includes("medicine_add"));
    assert.ok(actions.includes("medicine_edit"));
    assert.ok(actions.includes("medicine_remove"));
    assert.ok(actions.includes("pause"));
    assert.ok(actions.includes("resume"));
    assert.equal(audits[0]?.who, "Rohit");
    assert.match(audits[0]?.at || "", /\+05:30$/);
  });

  it("rejects a bad call time", async () => {
    await assert.rejects(() => updateCallTime("parent_kamla", "morning", "Rohit"));
  });
});
