import { randomBytes } from "node:crypto";
import { z } from "zod";
import { writeAudit } from "@/lib/audit";
import { query } from "@/lib/db/client";
import { setPaused } from "@/lib/db/queries";
import { languageCodes } from "@/lib/onboard-form";
import { firstName } from "@/lib/names";
import { toE164 } from "@/lib/phone";

const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Pick a morning call time.");
const langsSchema = z.array(z.string().min(1)).min(1, "Pick at least one language.");

function id(prefix: string) {
  return `${prefix}_${randomBytes(6).toString("hex")}`;
}

async function parentMeta(parentId: string) {
  const rows = await query<{ is_example: boolean; call_time: string; languages: string; paused: boolean }>(
    `select is_example, call_time, languages, paused from parents where id = $1`,
    [parentId],
  );
  return rows[0] ?? null;
}

export async function actorName(parentId: string) {
  const rows = await query<{ full_name: string }>(
    `select full_name from contacts where parent_id = $1 and role = 'child' order by id limit 1`,
    [parentId],
  );
  return rows[0]?.full_name || "family";
}

export async function updateCallTime(parentId: string, callTime: string, who: string) {
  const time = timeSchema.parse(callTime);
  const parent = await parentMeta(parentId);
  if (!parent) throw new Error("unknown_parent");
  if (parent.call_time === time) return { ok: true as const, unchanged: true };
  await query(`update parents set call_time = $2 where id = $1`, [parentId, time]);
  await writeAudit(parentId, who, { action: "call_time", before: parent.call_time, after: time }, parent.is_example);
  return { ok: true as const, unchanged: false };
}

export async function updateLanguages(parentId: string, codes: string[], who: string) {
  const parsed = langsSchema.parse(codes);
  const next = languageCodes(parsed);
  const parent = await parentMeta(parentId);
  if (!parent) throw new Error("unknown_parent");
  if (parent.languages === next) return { ok: true as const, unchanged: true };
  await query(`update parents set languages = $2 where id = $1`, [parentId, next]);
  await writeAudit(parentId, who, { action: "languages", before: parent.languages, after: next }, parent.is_example);
  return { ok: true as const, unchanged: false };
}

export async function updatePaused(parentId: string, paused: boolean, who: string) {
  const parent = await parentMeta(parentId);
  if (!parent) throw new Error("unknown_parent");
  await setPaused(parentId, paused);
  await writeAudit(parentId, who, { action: paused ? "pause" : "resume", before: parent.paused, after: paused }, parent.is_example);
  return { ok: true as const };
}

export async function updateNeighbour(
  parentId: string,
  input: { name: string; phone: string } | null,
  who: string,
) {
  const parent = await parentMeta(parentId);
  if (!parent) throw new Error("unknown_parent");
  const existing = await query<{ id: string; full_name: string; phone: string }>(
    `select id, full_name, phone from contacts where parent_id = $1 and role = 'neighbour' limit 1`,
    [parentId],
  );
  const before = existing[0] ? { name: existing[0].full_name, phone: existing[0].phone } : null;

  if (input === null || (!input.name.trim() && !input.phone.trim())) {
    if (existing[0]) await query(`delete from contacts where id = $1`, [existing[0].id]);
    await writeAudit(parentId, who, { action: "neighbour", before, after: null }, parent.is_example);
    return { ok: true as const };
  }

  const phone = toE164(input.phone);
  if (!input.name.trim()) throw new Error("Add the neighbour's name, or clear both fields.");
  if (!phone) throw new Error("Use a 10-digit Indian mobile, or +91 then 10 digits.");
  const after = { name: input.name.trim(), phone };

  if (existing[0]) {
    await query(`update contacts set full_name = $2, first_name = $3, phone = $4 where id = $1`, [
      existing[0].id,
      after.name,
      firstName(after.name),
      after.phone,
    ]);
  } else {
    await query(
      `insert into contacts (id, parent_id, role, full_name, first_name, phone, locale, is_example, email)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id("contact"), parentId, "neighbour", after.name, firstName(after.name), after.phone, "hi", parent.is_example, null],
    );
  }
  await writeAudit(parentId, who, { action: "neighbour", before, after }, parent.is_example);
  return { ok: true as const };
}

export async function addMedicine(
  parentId: string,
  input: { name: string; time: string; meal: string },
  who: string,
) {
  const name = input.name.trim();
  if (!name) throw new Error("Name the tablet the way they say it.");
  const time = timeSchema.parse(input.time);
  const meal = input.meal.trim() || "with food";
  const parent = await parentMeta(parentId);
  if (!parent) throw new Error("unknown_parent");
  const medId = id("med");
  await query(
    `insert into medicines (id, parent_id, name, dose, appearance, meal, is_example) values ($1,$2,$3,$4,$5,$6,$7)`,
    [medId, parentId, name, "", name, meal, parent.is_example],
  );
  await query(`insert into schedules (id, medicine_id, time_local, is_example) values ($1,$2,$3,$4)`, [
    id("sch"),
    medId,
    time,
    parent.is_example,
  ]);
  await writeAudit(parentId, who, { action: "medicine_add", after: { id: medId, name, time, meal } }, parent.is_example);
  return { ok: true as const, id: medId };
}

export async function editMedicine(
  parentId: string,
  medId: string,
  input: { name: string; time: string; meal: string },
  who: string,
) {
  const name = input.name.trim();
  if (!name) throw new Error("Name the tablet the way they say it.");
  const time = timeSchema.parse(input.time);
  const meal = input.meal.trim() || "with food";
  const parent = await parentMeta(parentId);
  if (!parent) throw new Error("unknown_parent");
  const rows = await query<{ name: string; meal: string }>(
    `select name, meal from medicines where id = $1 and parent_id = $2`,
    [medId, parentId],
  );
  if (!rows[0]) throw new Error("unknown_medicine");
  const schedule = await query<{ time_local: string }>(`select time_local from schedules where medicine_id = $1 limit 1`, [
    medId,
  ]);
  await query(`update medicines set name = $2, appearance = $2, meal = $3 where id = $1`, [medId, name, meal]);
  if (schedule[0]) {
    await query(`update schedules set time_local = $2 where medicine_id = $1`, [medId, time]);
  } else {
    await query(`insert into schedules (id, medicine_id, time_local, is_example) values ($1,$2,$3,$4)`, [
      id("sch"),
      medId,
      time,
      parent.is_example,
    ]);
  }
  await writeAudit(
    parentId,
    who,
    {
      action: "medicine_edit",
      before: { id: medId, name: rows[0].name, time: schedule[0]?.time_local, meal: rows[0].meal },
      after: { id: medId, name, time, meal },
    },
    parent.is_example,
  );
  return { ok: true as const };
}

export async function removeMedicine(parentId: string, medId: string, who: string) {
  const parent = await parentMeta(parentId);
  if (!parent) throw new Error("unknown_parent");
  const rows = await query<{ name: string }>(`select name from medicines where id = $1 and parent_id = $2`, [
    medId,
    parentId,
  ]);
  if (!rows[0]) throw new Error("unknown_medicine");
  await query(`delete from schedules where medicine_id = $1`, [medId]);
  await query(`delete from dose_logs where medicine_id = $1`, [medId]);
  await query(`delete from medicines where id = $1`, [medId]);
  await writeAudit(parentId, who, { action: "medicine_remove", before: { id: medId, name: rows[0].name } }, parent.is_example);
  return { ok: true as const };
}
