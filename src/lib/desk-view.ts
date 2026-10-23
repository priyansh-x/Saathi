import { query } from "@/lib/db/client";
import { nowIstStamp } from "@/lib/time";

export const DESK_VIEW_COOKIE = "saathi_desk_view";
export const DESK_VIEW_DEBOUNCE_MS = 30 * 60 * 1000;

export function deskViewCookieName(parentId: string) {
  return `${DESK_VIEW_COOKIE}_${parentId}`.slice(0, 80);
}

export async function lastDeskViewAt(parentId: string, memberId: string | null) {
  const rows = memberId
    ? await query<{ at: string }>(
        `select at::text as at from desk_views
          where parent_id = $1 and member_id = $2
          order by at desc limit 1`,
        [parentId, memberId],
      )
    : await query<{ at: string }>(
        `select at::text as at from desk_views
          where parent_id = $1 and member_id is null
          order by at desc limit 1`,
        [parentId],
      );
  return rows[0]?.at ?? null;
}

export async function recordDeskView(args: {
  parentId: string;
  memberId?: string | null;
  now?: Date;
  cookieStamp?: string | null;
}) {
  const now = args.now ?? new Date();
  const memberId = args.memberId ?? null;
  if (args.cookieStamp) {
    const age = now.getTime() - Date.parse(args.cookieStamp);
    if (Number.isFinite(age) && age >= 0 && age < DESK_VIEW_DEBOUNCE_MS) {
      return { recorded: false as const, reason: "cookie" as const };
    }
  }
  const last = await lastDeskViewAt(args.parentId, memberId);
  if (last) {
    const age = now.getTime() - Date.parse(last);
    if (Number.isFinite(age) && age >= 0 && age < DESK_VIEW_DEBOUNCE_MS) {
      return { recorded: false as const, reason: "server" as const };
    }
  }
  const id = `dv_${args.parentId}_${now.getTime()}`.slice(0, 80);
  await query(`insert into desk_views (id, parent_id, member_id, at) values ($1,$2,$3,$4)`, [
    id,
    args.parentId,
    memberId,
    now.toISOString(),
  ]);
  return { recorded: true as const, id, at: nowIstStamp(now) };
}
