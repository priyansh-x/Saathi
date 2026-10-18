import { cookies } from "next/headers";
import { connection } from "next/server";
import { decodeSession, SESSION_COOKIE } from "@/lib/auth/session";
import { familyConsentRecord } from "@/lib/consent-export";
import { loadFamily } from "@/lib/family-load";
import { canDeleteFamily } from "@/lib/members";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const data = await loadFamily(token);
  if (!data) return new Response("Not found", { status: 404 });
  const email = decodeSession((await cookies()).get(SESSION_COOKIE)?.value)?.email ?? null;
  if (!(await canDeleteFamily(data.parent.id, email))) {
    return Response.json({ ok: false, error: "Only the owner can download the consent record." }, { status: 403 });
  }
  const record = await familyConsentRecord(data.parent.id);
  return new Response(JSON.stringify(record, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="saathi-consent.json"`,
    },
  });
}
