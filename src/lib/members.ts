import { randomBytes } from "node:crypto";
import { writeAudit } from "@/lib/audit";
import { publicBaseUrl } from "@/lib/config";
import { query } from "@/lib/db/client";
import type { Contact } from "@/lib/db/types";
import { firstName } from "@/lib/names";
import { toE164 } from "@/lib/phone";
import { nowIstStamp } from "@/lib/time";

export const MAX_FAMILY_MEMBERS = 3;

export async function childrenFor(parentId: string) {
  return query<Contact & { is_owner: boolean }>(
    `select * from contacts where parent_id = $1 and role = 'child' order by is_owner desc, id`,
    [parentId],
  );
}

export async function deskTokenForEmail(email: string) {
  const rows = await query<{ token: string }>(
    `select m.token
       from contacts c
       join magic_links m on m.parent_id = c.parent_id
      where lower(c.email) = $1 and c.role = 'child'
      order by c.is_owner desc, m.expires_at desc
      limit 1`,
    [email.trim().toLowerCase()],
  );
  return rows[0]?.token ?? null;
}

export async function ownerFor(parentId: string) {
  const kids = await childrenFor(parentId);
  return kids.find((c) => c.is_owner) ?? kids[0] ?? null;
}

export async function canDeleteFamily(parentId: string, email: string | null) {
  const parent = await query<{ is_example: boolean }>(`select is_example from parents where id = $1`, [parentId]);
  if (!parent[0]) return false;
  if (parent[0].is_example && !email) return true;
  const owner = await ownerFor(parentId);
  if (!owner?.email || !email) return false;
  return owner.email.trim().toLowerCase() === email.trim().toLowerCase();
}

export async function createInvite(parentId: string, createdBy: string) {
  const kids = await childrenFor(parentId);
  if (kids.length >= MAX_FAMILY_MEMBERS) {
    throw new Error("This family already has three members.");
  }
  const parent = await query<{ is_example: boolean }>(`select is_example from parents where id = $1`, [parentId]);
  if (!parent[0]) throw new Error("unknown_parent");
  const token = `inv_${randomBytes(12).toString("hex")}`;
  const expires = "2027-12-31T00:00:00+05:30";
  await query(
    `insert into family_invites (token, parent_id, created_by, expires_at, is_example) values ($1,$2,$3,$4,$5)`,
    [token, parentId, createdBy, expires, parent[0].is_example],
  );
  await writeAudit(parentId, createdBy, { action: "invite_create", after: { token } }, parent[0].is_example);
  return { token, url: `${publicBaseUrl()}/invite/${token}` };
}

export async function acceptInvite(token: string, input: { email: string; name: string; whatsapp: string }) {
  const rows = await query<{ parent_id: string; consumed_at: string | null; expires_at: string; is_example: boolean }>(
    `select parent_id, consumed_at, expires_at, is_example from family_invites where token = $1`,
    [token],
  );
  const invite = rows[0];
  if (!invite || invite.consumed_at) throw new Error("This invite is no longer valid.");
  if (new Date(invite.expires_at).getTime() < Date.now()) throw new Error("This invite has expired.");
  const kids = await childrenFor(invite.parent_id);
  if (kids.length >= MAX_FAMILY_MEMBERS) throw new Error("This family already has three members.");
  const name = input.name.trim();
  if (!name) throw new Error("Add your name.");
  const phone = toE164(input.whatsapp);
  if (!phone) throw new Error("Use a 10-digit Indian mobile, or +91 then 10 digits.");
  const email = input.email.trim().toLowerCase();
  const id = `contact_${randomBytes(6).toString("hex")}`;
  await query(
    `insert into contacts (id, parent_id, role, full_name, first_name, phone, locale, is_example, email, is_owner)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [id, invite.parent_id, "child", name, firstName(name), phone, "en", invite.is_example, email, false],
  );
  await query(`update family_invites set consumed_at = $2 where token = $1`, [token, nowIstStamp()]);
  await writeAudit(invite.parent_id, name, { action: "invite_accept", after: { email, phone } }, invite.is_example);
  const desk = await query<{ token: string }>(`select token from magic_links where parent_id = $1 limit 1`, [
    invite.parent_id,
  ]);
  return { parentId: invite.parent_id, contactId: id, deskToken: desk[0]?.token };
}
