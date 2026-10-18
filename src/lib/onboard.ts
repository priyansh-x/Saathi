import { randomBytes } from "node:crypto";
import { CHILD_WRITTEN_TEXT, CHILD_WRITTEN_VERSION, languageCodes, parseOnboard, type OnboardInput } from "@/lib/onboard-form";
import { defaultLadder } from "@/lib/config";
import { query } from "@/lib/db/client";
import { firstName } from "@/lib/names";
import { toE164 } from "@/lib/phone";
import { nowIstStamp } from "@/lib/time";

function id(prefix: string) {
  return `${prefix}_${randomBytes(6).toString("hex")}`;
}

export async function createHousehold(input: OnboardInput, childEmail: string) {
  const parsed = parseOnboard(input);
  if (!parsed.ok) throw new Error(parsed.error);
  const data = parsed.data;
  const parentId = id("parent");
  const token = `d_${randomBytes(12).toString("hex")}`;
  const at = nowIstStamp();
  const address = data.addressTerm;
  const childFirst = firstName(data.childName);
  const parentFirst = firstName(data.parentName);
  const ladder = defaultLadder();
  const expires = "2027-12-31T00:00:00+05:30";
  const neighbourE164 = data.neighborName.trim() ? toE164(data.neighborPhone) : null;

  await query(
    `insert into parents (
       id, full_name, first_name, city, timezone, phone, languages, call_time,
       paused, recording_consent, is_example, consent_status, consent_at, consent_later_count, address_term
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [
      parentId,
      data.parentName,
      parentFirst,
      data.city,
      "Asia/Kolkata",
      data.parentPhone,
      languageCodes(data.languages),
      data.callTime,
      false,
      false,
      false,
      "pending",
      null,
      0,
      address,
    ],
  );

  await query(
    `insert into family_config (parent_id, retry_10, retry_25, soft_30, last_45, escalate_60, voice_alert_child, is_example)
     values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [parentId, ladder.retry_10, ladder.retry_25, ladder.soft_30, ladder.last_45, ladder.escalate_60, false, false],
  );

  await query(
    `insert into contacts (id, parent_id, role, full_name, first_name, phone, locale, is_example, email)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      id("contact"),
      parentId,
      "child",
      data.childName,
      childFirst,
      data.childWhatsapp,
      "en",
      false,
      childEmail.trim().toLowerCase(),
    ],
  );

  if (neighbourE164 && data.neighborName.trim()) {
    await query(
      `insert into contacts (id, parent_id, role, full_name, first_name, phone, locale, is_example, email)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        id("contact"),
        parentId,
        "neighbour",
        data.neighborName.trim(),
        firstName(data.neighborName),
        neighbourE164,
        "hi",
        false,
        null,
      ],
    );
  }

  for (const med of data.medicines) {
    const medId = id("med");
    const meal = med.withFood ? "with food" : "without food";
    await query(
      `insert into medicines (id, parent_id, name, dose, appearance, meal, is_example)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [medId, parentId, med.name, "", med.name, meal, false],
    );
    await query(`insert into schedules (id, medicine_id, time_local, is_example) values ($1,$2,$3,$4)`, [
      id("sch"),
      medId,
      med.time,
      false,
    ]);
  }

  const evidence = JSON.stringify({
    version: CHILD_WRITTEN_VERSION,
    who: data.childName,
    who_email: childEmail.trim().toLowerCase(),
    when: at,
    text: CHILD_WRITTEN_TEXT,
  });

  await query(
    `insert into consents (id, parent_id, kind, granted, at, evidence, is_example)
     values ($1,$2,$3,$4,$5,$6,$7)`,
    [id("con"), parentId, "child_written", true, at, evidence, false],
  );

  await query(`insert into magic_links (token, parent_id, expires_at, is_example) values ($1,$2,$3,$4)`, [
    token,
    parentId,
    expires,
    false,
  ]);

  return { token, parentId, addressTerm: address, callTime: data.callTime };
}

export { parseOnboard } from "@/lib/onboard-form";
