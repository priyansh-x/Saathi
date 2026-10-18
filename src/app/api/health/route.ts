import { connection } from "next/server";

/** Public liveness. Used by /ops "reachable" over HTTPS. No secrets. */
export async function GET() {
  await connection();
  return Response.json({ ok: true });
}
