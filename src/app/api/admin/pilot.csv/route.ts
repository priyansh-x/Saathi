import { connection } from "next/server";
import { notFound } from "next/navigation";
import { adminEnabled } from "@/lib/admin/auth";
import { getAdminGate } from "@/lib/admin/gate";
import { loadPilotMetrics } from "@/lib/admin/pilot";
import { pilotCsv } from "@/lib/admin/pilot-metrics";

export async function GET() {
  await connection();
  if (!adminEnabled()) notFound();
  const gate = await getAdminGate();
  if (!gate.ok) return new Response("unauthorized", { status: 401 });
  const { rows, totals } = await loadPilotMetrics();
  const body = pilotCsv([...rows, totals]);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="saathi-pilot.csv"',
      "Cache-Control": "no-store",
    },
  });
}
